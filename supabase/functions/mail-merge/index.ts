import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MergeRequest {
  documentId: string;
  spreadsheetId: string;
  userId: string;
  jobId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, spreadsheetId, userId, jobId }: MergeRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user's Google access token
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('google_access_token')
      .eq('id', userId)
      .single()

    if (userError || !user?.google_access_token) {
      throw new Error('Invalid user or missing Google access token')
    }

    // Update job status to processing
    await supabaseClient
      .from('merge_jobs')
      .update({ status: 'processing' })
      .eq('id', jobId)

    // Fetch document content
    const docResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${user.google_access_token}`,
        },
      }
    )

    if (!docResponse.ok) {
      throw new Error('Failed to fetch document content')
    }

    const docData = await docResponse.json()

    // Fetch spreadsheet data
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z`,
      {
        headers: {
          Authorization: `Bearer ${user.google_access_token}`,
        },
      }
    )

    if (!sheetResponse.ok) {
      throw new Error('Failed to fetch spreadsheet data')
    }

    const sheetData = await sheetResponse.json()

    if (!sheetData.values || sheetData.values.length < 2) {
      throw new Error('Insufficient data in spreadsheet')
    }

    const headers = sheetData.values[0]
    const rows = sheetData.values.slice(1)

    // Update total records count
    await supabaseClient
      .from('merge_jobs')
      .update({ total_records: rows.length })
      .eq('id', jobId)

    const downloadUrls = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Create data object from headers and row values
      const rowData: Record<string, string> = {}
      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] || ''
      })

      // Extract document content and replace merge fields
      let content = extractDocumentText(docData)
      
      // Replace merge fields with actual data
      Object.entries(rowData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        content = content.replace(regex, value)
      })

      // Create a copy of the document with merged content
      const createResponse = await fetch(
        'https://docs.googleapis.com/v1/documents',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.google_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Merged Document ${i + 1} - ${rowData[headers[0]] || 'Document'}`,
          }),
        }
      )

      if (!createResponse.ok) {
        console.error(`Failed to create document for row ${i + 1}`)
        continue
      }

      const newDoc = await createResponse.json()

      // Insert the merged content
      await fetch(
        `https://docs.googleapis.com/v1/documents/${newDoc.documentId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.google_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: content,
                },
              },
            ],
          }),
        }
      )

      // Export as PDF
      const exportResponse = await fetch(
        `https://docs.googleapis.com/v1/documents/${newDoc.documentId}:export?mimeType=application/pdf`,
        {
          headers: {
            Authorization: `Bearer ${user.google_access_token}`,
          },
        }
      )

      if (exportResponse.ok) {
        const pdfBuffer = await exportResponse.arrayBuffer()
        
        // Here you would typically upload the PDF to storage
        // For now, we'll just store the document ID
        downloadUrls.push({
          name: `merged_document_${i + 1}.pdf`,
          documentId: newDoc.documentId,
          url: `https://docs.google.com/document/d/${newDoc.documentId}/export?format=pdf`,
        })
      }

      // Update progress
      await supabaseClient
        .from('merge_jobs')
        .update({ processed_records: i + 1 })
        .eq('id', jobId)
    }

    // Update job status to completed
    await supabaseClient
      .from('merge_jobs')
      .update({ 
        status: 'completed',
        download_urls: downloadUrls,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: rows.length,
        downloadUrls,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Mail merge error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function extractDocumentText(docData: any): string {
  let text = ''
  
  if (docData.body && docData.body.content) {
    for (const element of docData.body.content) {
      if (element.paragraph) {
        for (const textElement of element.paragraph.elements || []) {
          if (textElement.textRun) {
            text += textElement.textRun.content
          }
        }
      }
    }
  }
  
  return text
}
