# Student Data Transformation Tool

A beginner-friendly, responsive dashboard for exploring and transforming student CSV datasets. Built for the **“Transform the Data”** Data Analytics internship task.

## Project files

- `index.html` — dashboard layout and controls
- `style.css` — responsive styling
- `script.js` — CSV parsing, transformations, table, chart and downloads
- `sample-data.csv` — 22 fictional student records

## Run the project

1. Download and extract the project ZIP.
2. Open the extracted folder in Visual Studio Code.
3. Open `index.html` in a browser, or use the VS Code **Live Server** extension and select **Open with Live Server**.
4. The sample dataset loads automatically. To use your own data, choose a `.csv` file in the upload area.

> Chart.js is loaded from a CDN, so the performance chart needs an internet connection. The core CSV and transformation features run in the browser.

## Features

- Upload a CSV file (up to 10 MB) or reload the sample dataset.
- Search records and sort by clicking a table heading.
- View row, column, transformed-record and non-empty-cell summary cards.
- Rename columns and convert values to text, number or date.
- Filter using equality, contains, empty and numeric comparison conditions.
- Sort rows ascending or descending.
- Normalize text with trim, title case, uppercase or lowercase.
- Create calculated columns: numeric total, average, grade or performance category.
- Remove unwanted columns.
- Apply multiple quick-clean operations together.
- Undo the last operation or reset the working dataset to the original.
- Compare original and current dataset summaries.
- Export the transformed or original data as CSV.

## How it works

The app parses CSV content in JavaScript and keeps two separate copies: an original dataset and a working dataset. Transformations change only the working copy. Undo uses a local in-memory history; reset restores the original copy. CSV export creates a downloadable file in the browser.

No external database is connected. The application does not upload dataset contents to a server or store them in a remote database. Data remains in the current browser session; reloading the page starts with the sample dataset again.

## Notes and limitations

- CSV is supported; Excel `.xlsx` files are not supported directly. Export an Excel sheet as CSV before uploading.
- Date conversion uses the browser's JavaScript date parser. For best results, use standard date formats such as `YYYY-MM-DD`.
- Invalid numeric/date values are preserved unchanged and reported in the status message.
- The sample records and names are fictional and provided for demonstration only.
- The dashboard is a frontend learning project and does not claim a live backend/database integration.

## Suggested demo flow

1. Load the sample dataset and inspect the table.
2. Rename `Student Name` or normalize it using Title Case.
3. Create an `Average Marks` calculated column.
4. Filter by department or attendance.
5. Compare the row/column counts and export the transformed CSV.
