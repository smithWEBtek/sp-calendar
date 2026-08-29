import ical from 'node-ical';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

// Your public Google Calendar iCal URL
const CALENDAR_URL = "https://calendar.google.com/calendar/ical/c_e0c52e8a02a5265d9dd2536fd336e0ae6a04081c9a1682186db5c3a24028f07d%40group.calendar.google.com/public/basic.ics";
const OUTPUT_FILE = "calendar_output.csv";

async function parseIcalToCsvFile(url, outputPath) {
    try {
        console.log('Fetching calendar data...');
        
        // Google often blocks default requests. Adding a User-Agent fixes this.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Google Calendar rejected request! HTTP status: ${response.status}`);
        }
        
        const icsText = await response.text();
        const data = ical.parseICS(icsText);

        const csvRows = [];
        
        for (let k in data) {
            if (Object.prototype.hasOwnProperty.call(data, k)) {
                const event = data[k];
                if (event.type === 'VEVENT') {
                    const start = event.start ? new Date(event.start) : null;
                    const end = event.end ? new Date(event.end) : null;

                    csvRows.push({
                        Subject: event.summary || '',
                        'Start Date': start ? start.toLocaleDateString('en-US') : '',
                        'Start Time': start && typeof start.getHours === 'function' ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
                        'End Date': end ? end.toLocaleDateString('en-US') : '',
                        'End Time': end && typeof end.getHours === 'function' ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
                        Description: event.description || '',
                        Location: event.location || ''
                    });
                }
            }
        }

        if (csvRows.length === 0) {
            console.warn('⚠️ No VEVENT items found inside the parsed data.');
            return;
        }

        // Convert array of objects to formatted CSV text
        const csvString = stringify(csvRows, { header: true });
        
        // Write the CSV string to a file
        fs.writeFileSync(outputPath, csvString, 'utf-8');
        console.log(`✅ Success! Landed ${csvRows.length} events into: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error processing calendar:', error);
    }
}

parseIcalToCsvFile(CALENDAR_URL, OUTPUT_FILE);
