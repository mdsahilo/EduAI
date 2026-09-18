// Integration helper for Google Sheets Export
// When the student clicks "Export Study Plan to Google Sheets" or "Sync Exam Schedule"
// we use the authenticated OAuth access token to create or append rows in Google Sheets.

export interface SheetRowData {
  range: string;
  values: (string | number)[][];
}

export async function exportStudyPlanToSheets(
  accessToken: string,
  planTitle: string,
  tasks: Array<{ day: number; dateStr: string; title: string; subject: string; estimatedHours: number; completed: boolean }>
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create a new Google Sheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `EduAI Study Schedule - ${planTitle}`,
      },
      sheets: [
        {
          properties: {
            title: 'Study Tasks',
            gridProperties: {
              rowCount: 50,
              columnCount: 6,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Sheet.');
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate Header & Task Rows
  const headers = ['Day', 'Target Date', 'Subject', 'Focus Topic & Study Task', 'Est. Hours', 'Status'];
  const rows: (string | number)[][] = [headers];

  tasks.forEach((t) => {
    rows.push([
      `Day ${t.day}`,
      t.dateStr,
      t.subject,
      t.title,
      `${t.estimatedHours} hrs`,
      t.completed ? 'COMPLETED' : 'PENDING',
    ]);
  });

  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Study Tasks!A1:F${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Study Tasks!A1:F${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!appendResponse.ok) {
    console.warn('Could not populate rows in sheet');
  }

  return { spreadsheetId, spreadsheetUrl };
}
