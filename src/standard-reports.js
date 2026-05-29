// src/standard-reports.js

export const standardReports = [
  // ── Operational / Print-Ready Reports ─────────────────────────────

  {
    id: 'daily-booking-log',
    name: 'Daily Booking Log',
    description: 'Chronological register of all bookings processed. Includes intake details, charges, bond status, and housing assignment.',
    domain: 'justice',
    badge: 'Standard Report',
    freshness: 'Updated hourly',
    parameters: [
      { id: 'date', label: 'Date', type: 'select',
        options: ['03/31/2026', '03/30/2026', '03/29/2026', '03/28/2026'], default: '03/31/2026' },
      { id: 'facility', label: 'Facility', type: 'select',
        options: ['All Facilities', 'Main Detention Center', 'West Annex', 'Juvenile Hall'], default: 'All Facilities' },
      { id: 'shift', label: 'Shift', type: 'select',
        options: ['All Shifts', '1st (0600–1400)', '2nd (1400–2200)', '3rd (2200–0600)'], default: 'All Shifts' },
      { id: 'chargeLevel', label: 'Charge Level', type: 'select',
        options: ['All Levels', 'Felony', 'Misdemeanor', 'Infraction'], default: 'All Levels' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Agency', value: 'County Sheriff\'s Office' },
        { label: 'Report Date', value: '03/31/2026' },
        { label: 'Generated', value: '03/31/2026 08:15 AM' },
        { label: 'Facility', value: 'All Facilities' },
        { label: 'Shift', value: 'All Shifts' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Booking Register', dataKey: 'bookings',
        columns: [
          { property: 'bookingNo', header: 'Booking #' },
          { property: 'time', header: 'Time' },
          { property: 'name', header: 'Name' },
          { property: 'dob', header: 'DOB' },
          { property: 'charge', header: 'Primary Charge' },
          { property: 'level', header: 'Level' },
          { property: 'bond', header: 'Bond' },
          { property: 'housing', header: 'Housing' },
          { property: 'officer', header: 'Arresting Officer' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Bookings', value: '23' },
        { label: 'Felony', value: '9' },
        { label: 'Misdemeanor', value: '12' },
        { label: 'Infraction', value: '2' }
      ]}
    ],
    data: {
      bookings: [
        { bookingNo: 'BK-2026-04482', time: '00:18', name: 'MARTINEZ, CARLOS R', dob: '04/12/1988', charge: 'DUI — 2nd Offense', level: 'Misd', bond: '$2,500', housing: 'B-204', officer: 'Ofc. Tran' },
        { bookingNo: 'BK-2026-04483', time: '01:05', name: 'WILLIAMS, DESHAWN L', dob: '09/03/1995', charge: 'Aggravated Assault', level: 'Felony', bond: '$50,000', housing: 'A-112', officer: 'Ofc. Reyes' },
        { bookingNo: 'BK-2026-04484', time: '01:42', name: 'JOHNSON, TAMIKA M', dob: '11/28/1990', charge: 'Shoplifting < $500', level: 'Misd', bond: '$500', housing: 'C-308', officer: 'Ofc. Novak' },
        { bookingNo: 'BK-2026-04485', time: '02:30', name: 'OCONNOR, PATRICK J', dob: '06/15/1982', charge: 'Domestic Battery', level: 'Felony', bond: 'No Bond', housing: 'A-105', officer: 'Ofc. Kim' },
        { bookingNo: 'BK-2026-04486', time: '03:15', name: 'NGUYEN, THAO V', dob: '01/22/1999', charge: 'Possession — Controlled Subst.', level: 'Felony', bond: '$10,000', housing: 'B-210', officer: 'Ofc. Tran' },
        { bookingNo: 'BK-2026-04487', time: '04:00', name: 'SMITH, ROBERT A', dob: '03/08/1975', charge: 'Trespass', level: 'Misd', bond: '$250', housing: 'C-301', officer: 'Ofc. Garcia' },
        { bookingNo: 'BK-2026-04488', time: '05:22', name: 'DAVIS, ANGELA K', dob: '07/19/1993', charge: 'Warrant — FTA', level: 'Misd', bond: '$1,000', housing: 'C-315', officer: 'Ofc. Patel' },
        { bookingNo: 'BK-2026-04489', time: '06:10', name: 'GARCIA, MIGUEL A', dob: '12/05/1987', charge: 'Burglary — Residential', level: 'Felony', bond: '$25,000', housing: 'A-108', officer: 'Ofc. Reyes' },
        { bookingNo: 'BK-2026-04490', time: '07:45', name: 'BROWN, TYRELL D', dob: '02/14/1991', charge: 'Disorderly Conduct', level: 'Infr', bond: '$100', housing: 'C-302', officer: 'Ofc. Novak' },
        { bookingNo: 'BK-2026-04491', time: '08:30', name: 'THOMPSON, LISA M', dob: '08/27/1984', charge: 'Identity Theft', level: 'Felony', bond: '$15,000', housing: 'B-201', officer: 'Ofc. Kim' },
        { bookingNo: 'BK-2026-04492', time: '09:12', name: 'JACKSON, DARIUS W', dob: '10/03/1996', charge: 'Evading Arrest', level: 'Misd', bond: '$3,000', housing: 'B-215', officer: 'Ofc. Tran' },
        { bookingNo: 'BK-2026-04493', time: '09:58', name: 'PATEL, ANISH R', dob: '05/11/1989', charge: 'Fraud — Check', level: 'Felony', bond: '$8,000', housing: 'B-206', officer: 'Ofc. Garcia' },
        { bookingNo: 'BK-2026-04494', time: '10:35', name: 'LOPEZ, MARIA C', dob: '09/20/1992', charge: 'Simple Assault', level: 'Misd', bond: '$1,500', housing: 'C-310', officer: 'Ofc. Patel' },
        { bookingNo: 'BK-2026-04495', time: '11:20', name: 'WHITE, JAMES T', dob: '04/02/1978', charge: 'Driving While Suspended', level: 'Misd', bond: '$750', housing: 'C-305', officer: 'Ofc. Novak' },
        { bookingNo: 'BK-2026-04496', time: '12:05', name: 'HARRIS, KEANDRA N', dob: '06/30/1997', charge: 'Possession w/ Intent', level: 'Felony', bond: '$35,000', housing: 'A-110', officer: 'Ofc. Reyes' },
        { bookingNo: 'BK-2026-04497', time: '13:15', name: 'CLARK, STEVEN R', dob: '11/14/1980', charge: 'Violation of Protective Order', level: 'Misd', bond: '$5,000', housing: 'A-103', officer: 'Ofc. Kim' },
        { bookingNo: 'BK-2026-04498', time: '14:00', name: 'WRIGHT, DESTINY L', dob: '03/25/1994', charge: 'Retail Theft — Organized', level: 'Felony', bond: '$12,000', housing: 'B-208', officer: 'Ofc. Garcia' },
        { bookingNo: 'BK-2026-04499', time: '14:48', name: 'MOORE, BRANDON K', dob: '08/08/1986', charge: 'Public Intoxication', level: 'Infr', bond: '$100', housing: 'C-303', officer: 'Ofc. Tran' },
        { bookingNo: 'BK-2026-04500', time: '15:30', name: 'ALLEN, MARCUS J', dob: '01/17/1990', charge: 'Aggravated DUI', level: 'Felony', bond: '$20,000', housing: 'A-115', officer: 'Ofc. Patel' },
        { bookingNo: 'BK-2026-04501', time: '16:22', name: 'YOUNG, TIFFANY R', dob: '07/04/1998', charge: 'Theft of Motor Vehicle', level: 'Misd', bond: '$7,500', housing: 'B-212', officer: 'Ofc. Reyes' },
        { bookingNo: 'BK-2026-04502', time: '17:10', name: 'KING, DERRICK S', dob: '12/21/1983', charge: 'Battery — LEO', level: 'Felony', bond: 'No Bond', housing: 'A-101', officer: 'Ofc. Kim' },
        { bookingNo: 'BK-2026-04503', time: '18:45', name: 'SCOTT, AMANDA J', dob: '02/09/1991', charge: 'Criminal Mischief', level: 'Misd', bond: '$1,000', housing: 'C-312', officer: 'Ofc. Novak' },
        { bookingNo: 'BK-2026-04504', time: '19:30', name: 'ROBINSON, ANDRE L', dob: '10/16/1985', charge: 'Weapon — Unlawful Carry', level: 'Misd', bond: '$5,000', housing: 'B-203', officer: 'Ofc. Garcia' }
      ]
    },
    matchKeywords: ['booking log', 'daily bookings', 'arrest log', 'intake log', 'booking register', 'jail bookings', 'inmate intake', 'booking report', 'arrests', 'arrest type', 'arrest status', 'arrest report', 'arrests by type', 'arrests grouped', 'past 30 days arrests', 'arrest activity'],
    suggestions: ['Show only felonies', 'Filter to 3rd shift', 'Show no-bond holds', 'Filter by officer', 'Export for shift briefing']
  },

  {
    id: 'permit-issuance-register',
    name: 'Permit Issuance Register',
    description: 'Daily log of permits issued with applicant details, property addresses, permit types, fees collected, and inspector assignments.',
    domain: 'permits-licensing',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'dateRange', label: 'Date Range', type: 'select',
        options: ['03/31/2026', '03/24–03/30', '03/17–03/23', 'March 2026'], default: '03/31/2026' },
      { id: 'permitType', label: 'Permit Type', type: 'select',
        options: ['All Types', 'Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition'], default: 'All Types' },
      { id: 'district', label: 'District', type: 'select',
        options: ['All Districts', 'Downtown', 'Westside', 'Eastside', 'North County'], default: 'All Districts' },
      { id: 'status', label: 'Status', type: 'select',
        options: ['All Statuses', 'Issued', 'Pending Review', 'Corrections Required'], default: 'All Statuses' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Community Development — Building Division' },
        { label: 'Report Date', value: '03/31/2026' },
        { label: 'Generated', value: '03/31/2026 06:00 AM' },
        { label: 'District', value: 'All Districts' },
        { label: 'Permit Types', value: 'All Types' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'grouped-table', title: 'Permits by Type',
        columns: [
          { property: 'permitNo', header: 'Permit #' },
          { property: 'address', header: 'Property Address' },
          { property: 'applicant', header: 'Applicant' },
          { property: 'description', header: 'Work Description' },
          { property: 'valuation', header: 'Valuation', align: 'right' },
          { property: 'fee', header: 'Fee', align: 'right' },
          { property: 'status', header: 'Status' },
          { property: 'inspector', header: 'Inspector' }
        ],
        groups: [
          { label: 'Building Permits', dataKey: 'buildingPermits',
            subtotal: { permitNo: '', address: '', applicant: '', description: 'Subtotal (8 permits)', valuation: '$2,847,000', fee: '$18,420', status: '', inspector: '' }
          },
          { label: 'Electrical Permits', dataKey: 'electricalPermits',
            subtotal: { permitNo: '', address: '', applicant: '', description: 'Subtotal (5 permits)', valuation: '$124,500', fee: '$2,890', status: '', inspector: '' }
          },
          { label: 'Plumbing Permits', dataKey: 'plumbingPermits',
            subtotal: { permitNo: '', address: '', applicant: '', description: 'Subtotal (4 permits)', valuation: '$86,200', fee: '$1,960', status: '', inspector: '' }
          }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Permits', value: '17' },
        { label: 'Total Valuation', value: '$3,057,700' },
        { label: 'Total Fees', value: '$23,270' }
      ]}
    ],
    data: {
      buildingPermits: [
        { permitNo: 'BP-2026-1187', address: '421 Oak Street', applicant: 'Henderson Builders LLC', description: 'New single-family residential', valuation: '$485,000', fee: '$3,200', status: 'Issued', inspector: 'R. Chen' },
        { permitNo: 'BP-2026-1188', address: '1500 Commerce Blvd', applicant: 'Apex Commercial Dev', description: 'Tenant improvement — office', valuation: '$120,000', fee: '$1,080', status: 'Issued', inspector: 'M. Foster' },
        { permitNo: 'BP-2026-1189', address: '845 Pine Ave', applicant: 'Ortiz, Maria', description: 'Residential addition — 2nd story', valuation: '$210,000', fee: '$1,640', status: 'Issued', inspector: 'R. Chen' },
        { permitNo: 'BP-2026-1190', address: '3200 Industrial Dr', applicant: 'Metro Warehouse Co', description: 'Warehouse expansion', valuation: '$890,000', fee: '$4,800', status: 'Pending Review', inspector: 'T. Williams' },
        { permitNo: 'BP-2026-1191', address: '67 Elm Court', applicant: 'Davis, Thomas J', description: 'Detached garage', valuation: '$52,000', fee: '$520', status: 'Issued', inspector: 'M. Foster' },
        { permitNo: 'BP-2026-1192', address: '2100 Market St #4B', applicant: 'Cornerstone Properties', description: 'Interior remodel — commercial', valuation: '$340,000', fee: '$2,400', status: 'Corrections Required', inspector: 'R. Chen' },
        { permitNo: 'BP-2026-1193', address: '910 Lakeview Terrace', applicant: 'Summit Homes Inc', description: 'New single-family residential', valuation: '$520,000', fee: '$3,400', status: 'Issued', inspector: 'T. Williams' },
        { permitNo: 'BP-2026-1194', address: '1455 River Rd', applicant: 'Chen, Wei', description: 'Deck and patio cover', valuation: '$28,000', fee: '$380', status: 'Issued', inspector: 'M. Foster' }
      ],
      electricalPermits: [
        { permitNo: 'EP-2026-0834', address: '421 Oak Street', applicant: 'Henderson Builders LLC', description: 'New construction — full service', valuation: '$42,000', fee: '$680', status: 'Issued', inspector: 'J. Park' },
        { permitNo: 'EP-2026-0835', address: '3405 Sunset Blvd', applicant: 'Bright Electric Co', description: 'Panel upgrade — 200A', valuation: '$8,500', fee: '$240', status: 'Issued', inspector: 'J. Park' },
        { permitNo: 'EP-2026-0836', address: '1500 Commerce Blvd', applicant: 'Apex Commercial Dev', description: 'Tenant improvement — electrical', valuation: '$18,000', fee: '$420', status: 'Issued', inspector: 'J. Park' },
        { permitNo: 'EP-2026-0837', address: '780 Birch Lane', applicant: 'SolarMax Installations', description: 'Rooftop solar — 8.4kW', valuation: '$32,000', fee: '$890', status: 'Pending Review', inspector: 'J. Park' },
        { permitNo: 'EP-2026-0838', address: '910 Lakeview Terrace', applicant: 'Summit Homes Inc', description: 'New construction — full service', valuation: '$24,000', fee: '$660', status: 'Issued', inspector: 'J. Park' }
      ],
      plumbingPermits: [
        { permitNo: 'PP-2026-0621', address: '421 Oak Street', applicant: 'Henderson Builders LLC', description: 'New construction — full rough-in', valuation: '$28,000', fee: '$540', status: 'Issued', inspector: 'D. Nakamura' },
        { permitNo: 'PP-2026-0622', address: '2200 Main St', applicant: 'Rivera Plumbing', description: 'Water heater replacement', valuation: '$4,200', fee: '$180', status: 'Issued', inspector: 'D. Nakamura' },
        { permitNo: 'PP-2026-0623', address: '910 Lakeview Terrace', applicant: 'Summit Homes Inc', description: 'New construction — full rough-in', valuation: '$32,000', fee: '$620', status: 'Issued', inspector: 'D. Nakamura' },
        { permitNo: 'PP-2026-0624', address: '1500 Commerce Blvd', applicant: 'Reliable Mechanical', description: 'Grease interceptor install', valuation: '$22,000', fee: '$620', status: 'Pending Review', inspector: 'D. Nakamura' }
      ]
    },
    matchKeywords: ['permit register', 'permits issued', 'building permits', 'permit log', 'permit activity', 'permit summary', 'daily permits', 'permit report', 'permits by month', 'permits by district', 'permit counts', 'permit revenue', 'quarterly permits', 'permit processing', 'building permit summary'],
    suggestions: ['Show only building permits', 'Filter to Downtown district', 'Show pending reviews only', 'Filter by inspector', 'Export fee summary']
  },

  {
    id: 'inspection-activity-log',
    name: 'Inspection Activity Log',
    description: 'Field inspection results by inspector with pass/fail outcomes, violation notes, re-inspection scheduling, and compliance tracking.',
    domain: 'code-enforcement',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'dateRange', label: 'Date Range', type: 'select',
        options: ['03/31/2026', '03/24–03/30', '03/17–03/23', 'March 2026'], default: '03/31/2026' },
      { id: 'inspector', label: 'Inspector', type: 'select',
        options: ['All Inspectors', 'R. Chen', 'M. Foster', 'T. Williams', 'J. Park', 'D. Nakamura'], default: 'All Inspectors' },
      { id: 'result', label: 'Result', type: 'select',
        options: ['All Results', 'Pass', 'Fail', 'Partial', 'Not Ready'], default: 'All Results' },
      { id: 'inspType', label: 'Inspection Type', type: 'select',
        options: ['All Types', 'Foundation', 'Framing', 'Electrical Rough', 'Plumbing Rough', 'Final', 'Re-Inspection'], default: 'All Types' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Community Development — Inspections' },
        { label: 'Report Date', value: '03/31/2026' },
        { label: 'Generated', value: '03/31/2026 05:30 AM' },
        { label: 'Inspector', value: 'All Inspectors' },
        { label: 'Results', value: 'All Results' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'grouped-table', title: 'Inspections by Inspector',
        columns: [
          { property: 'time', header: 'Time' },
          { property: 'permitNo', header: 'Permit #' },
          { property: 'address', header: 'Address' },
          { property: 'type', header: 'Inspection Type' },
          { property: 'result', header: 'Result' },
          { property: 'notes', header: 'Notes' }
        ],
        groups: [
          { label: 'R. Chen — 6 inspections', dataKey: 'chenInspections',
            subtotal: { time: '', permitNo: '', address: '', type: 'Pass: 4 / Fail: 1 / Partial: 1', result: '', notes: '' }
          },
          { label: 'M. Foster — 5 inspections', dataKey: 'fosterInspections',
            subtotal: { time: '', permitNo: '', address: '', type: 'Pass: 3 / Fail: 1 / Not Ready: 1', result: '', notes: '' }
          },
          { label: 'T. Williams — 4 inspections', dataKey: 'williamsInspections',
            subtotal: { time: '', permitNo: '', address: '', type: 'Pass: 2 / Fail: 1 / Partial: 1', result: '', notes: '' }
          }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Inspections', value: '15' },
        { label: 'Pass', value: '9' },
        { label: 'Fail', value: '3' },
        { label: 'Partial', value: '2' },
        { label: 'Not Ready', value: '1' }
      ]}
    ],
    data: {
      chenInspections: [
        { time: '07:30', permitNo: 'BP-2026-1142', address: '320 Maple Dr', type: 'Foundation', result: 'Pass', notes: '' },
        { time: '08:45', permitNo: 'BP-2026-1156', address: '1820 Park Ave', type: 'Framing', result: 'Pass', notes: '' },
        { time: '10:00', permitNo: 'BP-2026-1171', address: '455 Cedar Blvd', type: 'Final', result: 'Fail', notes: 'Handrail height non-compliant; smoke detectors not wired' },
        { time: '11:15', permitNo: 'EP-2026-0801', address: '910 Lakeview Terrace', type: 'Electrical Rough', result: 'Pass', notes: '' },
        { time: '13:30', permitNo: 'BP-2026-1180', address: '2100 Market St #4B', type: 'Framing', result: 'Partial', notes: 'Header at kitchen pass-through undersized — correction req.' },
        { time: '14:45', permitNo: 'BP-2026-1187', address: '421 Oak Street', type: 'Foundation', result: 'Pass', notes: 'Rebar and anchor bolts per plan' }
      ],
      fosterInspections: [
        { time: '07:00', permitNo: 'BP-2026-1160', address: '67 Elm Court', type: 'Foundation', result: 'Pass', notes: '' },
        { time: '08:30', permitNo: 'PP-2026-0598', address: '1400 River Rd', type: 'Plumbing Rough', result: 'Pass', notes: '' },
        { time: '10:15', permitNo: 'BP-2026-1175', address: '3600 Industrial Dr', type: 'Final', result: 'Fail', notes: 'Exit signage missing; fire extinguisher not mounted' },
        { time: '12:00', permitNo: 'BP-2026-1182', address: '890 Sunset Blvd', type: 'Framing', result: 'Not Ready', notes: 'Framing not complete — reschedule' },
        { time: '14:00', permitNo: 'EP-2026-0812', address: '2450 Commerce Way', type: 'Electrical Rough', result: 'Pass', notes: '' }
      ],
      williamsInspections: [
        { time: '08:00', permitNo: 'BP-2026-1165', address: '3200 Industrial Dr', type: 'Foundation', result: 'Pass', notes: '' },
        { time: '09:30', permitNo: 'BP-2026-1178', address: '550 Birch Lane', type: 'Final', result: 'Partial', notes: 'HVAC ductwork approved; plumbing test pending — return Thu' },
        { time: '11:00', permitNo: 'PP-2026-0610', address: '1200 Main St', type: 'Plumbing Rough', result: 'Fail', notes: 'Drain slope insufficient at master bath; no cleanout access' },
        { time: '13:30', permitNo: 'BP-2026-1190', address: '780 Walnut St', type: 'Framing', result: 'Pass', notes: '' }
      ]
    },
    matchKeywords: ['inspection log', 'inspection activity', 'inspection results', 'field inspections', 'pass fail', 'inspector report', 'inspection schedule', 'code inspection', 'code violations', 'violations by type', 'violation trends', 'code enforcement', 'violation summary', 'property maintenance', 'violations priority', 'open violations'],
    suggestions: ['Show only failures', 'Filter to R. Chen', 'Show re-inspections needed', 'Filter by inspection type', 'Export for supervisor review']
  },

  // ── Justice (additional) ─────────────────────────────────────────

  {
    id: 'court-docket-summary',
    name: 'Court Docket Summary',
    description: 'Daily summary of scheduled court hearings including case numbers, defendants, hearing types, assigned judges, and courtroom locations.',
    domain: 'justice',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'hearingDate', label: 'Hearing Date', type: 'select',
        options: ['04/01/2026', '03/31/2026', '03/30/2026', '03/29/2026'], default: '04/01/2026' },
      { id: 'courtroom', label: 'Courtroom', type: 'select',
        options: ['All Courtrooms', 'Courtroom 1A', 'Courtroom 2B', 'Courtroom 3C', 'Courtroom 4D'], default: 'All Courtrooms' },
      { id: 'hearingType', label: 'Hearing Type', type: 'select',
        options: ['All Types', 'Arraignment', 'Preliminary Hearing', 'Trial', 'Sentencing', 'Motion'], default: 'All Types' },
      { id: 'judge', label: 'Judge', type: 'select',
        options: ['All Judges', 'Hon. Martinez', 'Hon. Patel', 'Hon. Okafor', 'Hon. Bergstrom'], default: 'All Judges' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Court', value: 'County Superior Court' },
        { label: 'Docket Date', value: '04/01/2026' },
        { label: 'Generated', value: '04/01/2026 05:00 AM' },
        { label: 'Courtroom', value: 'All Courtrooms' },
        { label: 'Hearing Type', value: 'All Types' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Court Docket', dataKey: 'docket',
        columns: [
          { property: 'caseNo', header: 'Case #' },
          { property: 'time', header: 'Time' },
          { property: 'defendant', header: 'Defendant' },
          { property: 'hearingType', header: 'Hearing Type' },
          { property: 'charge', header: 'Primary Charge' },
          { property: 'judge', header: 'Judge' },
          { property: 'courtroom', header: 'Courtroom' },
          { property: 'status', header: 'Status' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Hearings', value: '9' },
        { label: 'Arraignments', value: '3' },
        { label: 'Trials', value: '2' },
        { label: 'Sentencings', value: '2' }
      ]}
    ],
    data: {
      docket: [
        { caseNo: 'CR-2026-00412', time: '08:30', defendant: 'ANDERSON, KYLE R', hearingType: 'Arraignment', charge: 'Burglary — 1st Degree', judge: 'Hon. Martinez', courtroom: '1A', status: 'Scheduled' },
        { caseNo: 'CR-2026-00389', time: '09:00', defendant: 'WASHINGTON, BREANN T', hearingType: 'Preliminary Hearing', charge: 'Fraud — Identity Theft', judge: 'Hon. Patel', courtroom: '2B', status: 'Scheduled' },
        { caseNo: 'CR-2025-01182', time: '09:30', defendant: 'TORRES, SAMUEL J', hearingType: 'Trial — Day 3', charge: 'Aggravated Assault', judge: 'Hon. Okafor', courtroom: '3C', status: 'In Progress' },
        { caseNo: 'CR-2026-00401', time: '10:00', defendant: 'NGUYEN, LINDA H', hearingType: 'Arraignment', charge: 'DUI — 3rd Offense', judge: 'Hon. Martinez', courtroom: '1A', status: 'Scheduled' },
        { caseNo: 'CR-2025-00944', time: '10:30', defendant: 'ROBINSON, MARCUS D', hearingType: 'Sentencing', charge: 'Possession w/ Intent', judge: 'Hon. Bergstrom', courtroom: '4D', status: 'Scheduled' },
        { caseNo: 'CR-2026-00378', time: '11:00', defendant: 'HILL, PATRICIA M', hearingType: 'Motion — Suppress Evidence', charge: 'Drug Trafficking', judge: 'Hon. Patel', courtroom: '2B', status: 'Continued' },
        { caseNo: 'CR-2025-01050', time: '13:00', defendant: 'CHEN, WILLIAM F', hearingType: 'Trial — Day 1', charge: 'Grand Theft Auto', judge: 'Hon. Okafor', courtroom: '3C', status: 'Scheduled' },
        { caseNo: 'CR-2025-00876', time: '14:00', defendant: 'GARCIA, ROSA L', hearingType: 'Sentencing', charge: 'Theft — Felony', judge: 'Hon. Martinez', courtroom: '1A', status: 'Scheduled' },
        { caseNo: 'CR-2026-00415', time: '14:30', defendant: 'PARKER, JAMES O', hearingType: 'Arraignment', charge: 'Vandalism — Felony', judge: 'Hon. Bergstrom', courtroom: '4D', status: 'Scheduled' }
      ]
    },
    matchKeywords: ['court docket', 'hearing schedule', 'court calendar', 'case hearings', 'arraignment', 'trial schedule', 'sentencing', 'judge docket', 'courtroom schedule', 'preliminary hearing'],
    suggestions: ['Show arraignments only', 'Filter to Hon. Martinez', 'Show trials only', 'Filter by courtroom', 'Export for court staff']
  },

  {
    id: 'jail-population-report',
    name: 'Jail Population Report',
    description: 'Current inmate population by facility, housing unit, charge classification, and legal status. Includes capacity utilization and population trend.',
    domain: 'justice',
    badge: 'Standard Report',
    freshness: 'Updated hourly',
    parameters: [
      { id: 'asOf', label: 'As Of', type: 'select',
        options: ['04/01/2026 06:00', '03/31/2026 18:00', '03/31/2026 06:00', '03/30/2026 18:00'], default: '04/01/2026 06:00' },
      { id: 'facility', label: 'Facility', type: 'select',
        options: ['All Facilities', 'Main Detention Center', 'West Annex', 'Juvenile Hall'], default: 'All Facilities' },
      { id: 'classification', label: 'Classification', type: 'select',
        options: ['All', 'Pretrial', 'Sentenced', 'Federal Hold', 'Detainer'], default: 'All' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Agency', value: 'County Sheriff\'s Office' },
        { label: 'Snapshot Time', value: '04/01/2026 06:00 AM' },
        { label: 'Generated', value: '04/01/2026 06:05 AM' },
        { label: 'Facility', value: 'All Facilities' },
        { label: 'Classification', value: 'All' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Population by Housing Unit', dataKey: 'population',
        columns: [
          { property: 'facility', header: 'Facility' },
          { property: 'unit', header: 'Unit' },
          { property: 'capacity', header: 'Capacity' },
          { property: 'occupied', header: 'Occupied' },
          { property: 'utilization', header: 'Utilization %' },
          { property: 'pretrial', header: 'Pretrial' },
          { property: 'sentenced', header: 'Sentenced' },
          { property: 'other', header: 'Other Holds' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Capacity', value: '480' },
        { label: 'Current Population', value: '412' },
        { label: 'Utilization', value: '85.8%' },
        { label: 'Available Beds', value: '68' }
      ]}
    ],
    data: {
      population: [
        { facility: 'Main Detention', unit: 'Block A', capacity: '96', occupied: '88', utilization: '91.7%', pretrial: '54', sentenced: '28', other: '6' },
        { facility: 'Main Detention', unit: 'Block B', capacity: '96', occupied: '84', utilization: '87.5%', pretrial: '60', sentenced: '20', other: '4' },
        { facility: 'Main Detention', unit: 'Block C', capacity: '96', occupied: '79', utilization: '82.3%', pretrial: '58', sentenced: '18', other: '3' },
        { facility: 'Main Detention', unit: 'Medical Unit', capacity: '24', occupied: '11', utilization: '45.8%', pretrial: '6', sentenced: '3', other: '2' },
        { facility: 'West Annex', unit: 'Annex 1', capacity: '80', occupied: '76', utilization: '95.0%', pretrial: '42', sentenced: '30', other: '4' },
        { facility: 'West Annex', unit: 'Annex 2', capacity: '64', occupied: '57', utilization: '89.1%', pretrial: '38', sentenced: '16', other: '3' },
        { facility: 'Juvenile Hall', unit: 'Unit Alpha', capacity: '24', occupied: '17', utilization: '70.8%', pretrial: '14', sentenced: '3', other: '0' }
      ]
    },
    matchKeywords: ['jail population', 'inmate count', 'facility capacity', 'housing units', 'bed utilization', 'pretrial population', 'sentenced population', 'jail census', 'population report', 'daily count'],
    suggestions: ['Show West Annex only', 'Filter to pretrial only', 'Show near-capacity units', 'Compare to last week', 'Export for facility manager']
  },

  // ── Permits & Licensing (additional) ────────────────────────────

  {
    id: 'license-renewal-status',
    name: 'License Renewal Status',
    description: 'Current status of all active business and professional licenses approaching or past their renewal deadline, including payment status and outstanding requirements.',
    domain: 'permits-licensing',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'renewalWindow', label: 'Renewal Window', type: 'select',
        options: ['Expiring in 30 days', 'Expiring in 60 days', 'Expiring in 90 days', 'Already Expired'], default: 'Expiring in 30 days' },
      { id: 'licenseType', label: 'License Type', type: 'select',
        options: ['All Types', 'Business License', 'Contractor License', 'Food Handler', 'Liquor License', 'Alarm Permit'], default: 'All Types' },
      { id: 'renewalStatus', label: 'Renewal Status', type: 'select',
        options: ['All Statuses', 'Renewed', 'Renewal Pending', 'Overdue', 'Notice Sent'], default: 'All Statuses' },
      { id: 'district', label: 'District', type: 'select',
        options: ['All Districts', 'Downtown', 'Westside', 'Eastside', 'North County'], default: 'All Districts' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Community Development — Licensing' },
        { label: 'Report Date', value: '04/01/2026' },
        { label: 'Generated', value: '04/01/2026 06:00 AM' },
        { label: 'Renewal Window', value: 'Expiring in 30 days' },
        { label: 'License Type', value: 'All Types' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'License Renewal Summary', dataKey: 'licenses',
        columns: [
          { property: 'licenseNo', header: 'License #' },
          { property: 'holder', header: 'License Holder' },
          { property: 'type', header: 'Type' },
          { property: 'expiryDate', header: 'Expiry Date' },
          { property: 'renewalStatus', header: 'Renewal Status' },
          { property: 'feeOwed', header: 'Fee Owed' },
          { property: 'noticeSent', header: 'Notice Sent' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Licenses in Window', value: '9' },
        { label: 'Renewed', value: '3' },
        { label: 'Pending / Overdue', value: '6' },
        { label: 'Fees Outstanding', value: '$4,820' }
      ]}
    ],
    data: {
      licenses: [
        { licenseNo: 'BL-2024-00812', holder: 'Rivera Family Restaurant', type: 'Business License', expiryDate: '04/15/2026', renewalStatus: 'Notice Sent', feeOwed: '$320', noticeSent: '03/15/2026' },
        { licenseNo: 'CL-2023-00341', holder: 'Apex Electrical Contractors', type: 'Contractor License', expiryDate: '04/10/2026', renewalStatus: 'Renewal Pending', feeOwed: '$850', noticeSent: '03/10/2026' },
        { licenseNo: 'LL-2024-00058', holder: 'The Tap Room LLC', type: 'Liquor License', expiryDate: '04/30/2026', renewalStatus: 'Renewed', feeOwed: '$0', noticeSent: '03/01/2026' },
        { licenseNo: 'FH-2025-00204', holder: 'Sunrise Catering Co', type: 'Food Handler', expiryDate: '04/20/2026', renewalStatus: 'Overdue', feeOwed: '$180', noticeSent: '03/05/2026' },
        { licenseNo: 'BL-2024-00934', holder: 'Metro Auto Detailing', type: 'Business License', expiryDate: '04/08/2026', renewalStatus: 'Renewed', feeOwed: '$0', noticeSent: '03/08/2026' },
        { licenseNo: 'AP-2024-00621', holder: 'SafeGuard Security Systems', type: 'Alarm Permit', expiryDate: '04/25/2026', renewalStatus: 'Notice Sent', feeOwed: '$120', noticeSent: '03/25/2026' },
        { licenseNo: 'CL-2023-00517', holder: 'Premier Plumbing Inc', type: 'Contractor License', expiryDate: '04/12/2026', renewalStatus: 'Renewal Pending', feeOwed: '$850', noticeSent: '03/12/2026' },
        { licenseNo: 'BL-2024-01055', holder: 'Eastside Nail & Spa', type: 'Business License', expiryDate: '04/28/2026', renewalStatus: 'Renewed', feeOwed: '$0', noticeSent: '03/28/2026' },
        { licenseNo: 'FH-2025-00319', holder: 'Golden Dragon Buffet', type: 'Food Handler', expiryDate: '04/05/2026', renewalStatus: 'Overdue', feeOwed: '$360', noticeSent: '03/01/2026' }
      ]
    },
    matchKeywords: ['license renewal', 'expiring licenses', 'business license status', 'renewal status', 'overdue licenses', 'license expiry', 'license compliance', 'contractor renewal', 'liquor license renewal', 'food handler renewal'],
    suggestions: ['Show overdue only', 'Filter to contractor licenses', 'Show unpaid fees', 'Export renewal notices', 'Filter to Downtown district']
  },

  {
    id: 'permit-application-backlog',
    name: 'Permit Application Backlog',
    description: 'All permit applications currently awaiting review, sorted by days pending. Highlights applications exceeding target review timelines and flags escalation candidates.',
    domain: 'permits-licensing',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'permitType', label: 'Permit Type', type: 'select',
        options: ['All Types', 'Building', 'Electrical', 'Plumbing', 'Mechanical', 'Demolition', 'Special Use'], default: 'All Types' },
      { id: 'ageThreshold', label: 'Age Threshold', type: 'select',
        options: ['All Pending', 'Over 5 days', 'Over 10 days', 'Over 20 days'], default: 'All Pending' },
      { id: 'reviewer', label: 'Assigned Reviewer', type: 'select',
        options: ['All Reviewers', 'R. Chen', 'M. Foster', 'T. Williams', 'Unassigned'], default: 'All Reviewers' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Community Development — Building Division' },
        { label: 'Report Date', value: '04/01/2026' },
        { label: 'Generated', value: '04/01/2026 07:00 AM' },
        { label: 'Status', value: 'Pending Review' },
        { label: 'Permit Type', value: 'All Types' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Applications Pending Review', dataKey: 'backlog',
        columns: [
          { property: 'appNo', header: 'Application #' },
          { property: 'submitDate', header: 'Submitted' },
          { property: 'daysPending', header: 'Days Pending' },
          { property: 'type', header: 'Type' },
          { property: 'address', header: 'Address' },
          { property: 'applicant', header: 'Applicant' },
          { property: 'reviewer', header: 'Reviewer' },
          { property: 'flag', header: 'Flag' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Pending', value: '9' },
        { label: 'Over 10 Days', value: '4' },
        { label: 'Unassigned', value: '2' },
        { label: 'Avg Days Pending', value: '11.2' }
      ]}
    ],
    data: {
      backlog: [
        { appNo: 'APP-2026-1348', submitDate: '03/03/2026', daysPending: '29', type: 'Building', address: '2200 Hillcrest Dr', applicant: 'Greenfield Developers', reviewer: 'R. Chen', flag: 'Escalate' },
        { appNo: 'APP-2026-1392', submitDate: '03/10/2026', daysPending: '22', type: 'Special Use', address: '450 Broadway Ave', applicant: 'City Church Foundation', reviewer: 'T. Williams', flag: 'Escalate' },
        { appNo: 'APP-2026-1441', submitDate: '03/15/2026', daysPending: '17', type: 'Building', address: '987 Cedar Blvd', applicant: 'Novak Construction', reviewer: 'M. Foster', flag: 'Escalate' },
        { appNo: 'APP-2026-1489', submitDate: '03/20/2026', daysPending: '12', type: 'Demolition', address: '130 West 5th St', applicant: 'Urban Renewal LLC', reviewer: 'T. Williams', flag: 'Escalate' },
        { appNo: 'APP-2026-1512', submitDate: '03/23/2026', daysPending: '9', type: 'Mechanical', address: '3400 Commerce Pkwy', applicant: 'Pacific HVAC Co', reviewer: 'Unassigned', flag: '' },
        { appNo: 'APP-2026-1535', submitDate: '03/25/2026', daysPending: '7', type: 'Electrical', address: '816 Park Lane', applicant: 'Brightside Electric', reviewer: 'R. Chen', flag: '' },
        { appNo: 'APP-2026-1558', submitDate: '03/27/2026', daysPending: '5', type: 'Plumbing', address: '1122 Spruce Ave', applicant: 'AquaFlow Plumbing', reviewer: 'Unassigned', flag: '' },
        { appNo: 'APP-2026-1572', submitDate: '03/29/2026', daysPending: '3', type: 'Building', address: '560 Oak Terrace', applicant: 'Webb Family Trust', reviewer: 'M. Foster', flag: '' },
        { appNo: 'APP-2026-1588', submitDate: '03/31/2026', daysPending: '1', type: 'Electrical', address: '2050 Harbor Blvd', applicant: 'SolarMax Installations', reviewer: 'R. Chen', flag: '' }
      ]
    },
    matchKeywords: ['permit backlog', 'pending permits', 'permit queue', 'applications pending', 'permit review queue', 'overdue permits', 'permit processing time', 'unassigned permits', 'escalated permits', 'permit age'],
    suggestions: ['Show only escalated', 'Filter to over 10 days', 'Show unassigned only', 'Filter by reviewer', 'Export for supervisor review']
  },

  // ── Code Enforcement (additional) ───────────────────────────────

  {
    id: 'open-violations-summary',
    name: 'Open Violations Summary',
    description: 'All currently open code enforcement violations by address, violation type, severity, and compliance deadline. Tracks resolution status and outstanding notices.',
    domain: 'code-enforcement',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'violationType', label: 'Violation Type', type: 'select',
        options: ['All Types', 'Property Maintenance', 'Zoning', 'Signage', 'Weed / Debris', 'Unpermitted Construction', 'Nuisance'], default: 'All Types' },
      { id: 'severity', label: 'Severity', type: 'select',
        options: ['All Severity', 'Critical', 'High', 'Medium', 'Low'], default: 'All Severity' },
      { id: 'district', label: 'District', type: 'select',
        options: ['All Districts', 'Downtown', 'Westside', 'Eastside', 'North County'], default: 'All Districts' },
      { id: 'officer', label: 'Assigned Officer', type: 'select',
        options: ['All Officers', 'Ofc. Torres', 'Ofc. Banks', 'Ofc. Huang', 'Ofc. Sullivan'], default: 'All Officers' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Community Development — Code Enforcement' },
        { label: 'Report Date', value: '04/01/2026' },
        { label: 'Generated', value: '04/01/2026 07:30 AM' },
        { label: 'Violation Type', value: 'All Types' },
        { label: 'Severity', value: 'All Severity' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Open Violations', dataKey: 'violations',
        columns: [
          { property: 'caseNo', header: 'Case #' },
          { property: 'address', header: 'Address' },
          { property: 'violationType', header: 'Violation Type' },
          { property: 'severity', header: 'Severity' },
          { property: 'openedDate', header: 'Opened' },
          { property: 'deadline', header: 'Compliance Deadline' },
          { property: 'status', header: 'Status' },
          { property: 'officer', header: 'Officer' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Open', value: '9' },
        { label: 'Critical / High', value: '4' },
        { label: 'Past Deadline', value: '3' },
        { label: 'Notices Issued', value: '7' }
      ]}
    ],
    data: {
      violations: [
        { caseNo: 'CE-2026-00281', address: '1840 Birch Lane', violationType: 'Unpermitted Construction', severity: 'Critical', openedDate: '02/14/2026', deadline: '03/15/2026', status: 'Past Deadline', officer: 'Ofc. Torres' },
        { caseNo: 'CE-2026-00305', address: '530 East 3rd St', violationType: 'Nuisance', severity: 'High', openedDate: '02/21/2026', deadline: '03/22/2026', status: 'Past Deadline', officer: 'Ofc. Banks' },
        { caseNo: 'CE-2026-00317', address: '2244 Harbor Dr', violationType: 'Property Maintenance', severity: 'High', openedDate: '02/28/2026', deadline: '03/31/2026', status: 'Past Deadline', officer: 'Ofc. Huang' },
        { caseNo: 'CE-2026-00342', address: '765 Walnut Ave', violationType: 'Zoning', severity: 'Medium', openedDate: '03/05/2026', deadline: '04/05/2026', status: 'Notice Sent', officer: 'Ofc. Sullivan' },
        { caseNo: 'CE-2026-00368', address: '3010 Westview Blvd', violationType: 'Signage', severity: 'Low', openedDate: '03/10/2026', deadline: '04/10/2026', status: 'Notice Sent', officer: 'Ofc. Torres' },
        { caseNo: 'CE-2026-00391', address: '88 Park Place', violationType: 'Weed / Debris', severity: 'Medium', openedDate: '03/14/2026', deadline: '04/14/2026', status: 'Notice Sent', officer: 'Ofc. Banks' },
        { caseNo: 'CE-2026-00408', address: '1570 Industrial Pkwy', violationType: 'Unpermitted Construction', severity: 'Critical', openedDate: '03/18/2026', deadline: '04/01/2026', status: 'Abatement Ordered', officer: 'Ofc. Huang' },
        { caseNo: 'CE-2026-00423', address: '412 Sunrise Ct', violationType: 'Property Maintenance', severity: 'Low', openedDate: '03/22/2026', deadline: '04/22/2026', status: 'Inspection Pending', officer: 'Ofc. Sullivan' },
        { caseNo: 'CE-2026-00439', address: '950 Magnolia St', violationType: 'Nuisance', severity: 'Medium', openedDate: '03/27/2026', deadline: '04/27/2026', status: 'Open — No Notice', officer: 'Ofc. Torres' }
      ]
    },
    matchKeywords: ['open violations', 'code violations', 'violation summary', 'active violations', 'compliance deadline', 'past deadline violations', 'code enforcement cases', 'nuisance cases', 'property violations', 'unpermitted construction'],
    suggestions: ['Show critical only', 'Filter to past-deadline', 'Show Ofc. Torres cases', 'Filter by violation type', 'Export for supervisor']
  },

  {
    id: 'case-resolution-report',
    name: 'Case Resolution Report',
    description: 'Weekly summary of code enforcement cases closed during the reporting period, including resolution type, days-to-resolve, and compliance outcome by officer.',
    domain: 'code-enforcement',
    badge: 'Standard Report',
    freshness: 'Updated weekly',
    parameters: [
      { id: 'weekEnding', label: 'Week Ending', type: 'select',
        options: ['03/28/2026', '03/21/2026', '03/14/2026', '03/07/2026'], default: '03/28/2026' },
      { id: 'outcome', label: 'Resolution Outcome', type: 'select',
        options: ['All Outcomes', 'Compliant — No Fine', 'Compliant — Fine Paid', 'Abatement by City', 'Referred to City Attorney', 'Dismissed'], default: 'All Outcomes' },
      { id: 'officer', label: 'Officer', type: 'select',
        options: ['All Officers', 'Ofc. Torres', 'Ofc. Banks', 'Ofc. Huang', 'Ofc. Sullivan'], default: 'All Officers' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Community Development — Code Enforcement' },
        { label: 'Week Ending', value: '03/28/2026' },
        { label: 'Generated', value: '03/29/2026 06:00 AM' },
        { label: 'Resolution Outcome', value: 'All Outcomes' },
        { label: 'Officer', value: 'All Officers' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Resolved Cases', dataKey: 'resolutions',
        columns: [
          { property: 'caseNo', header: 'Case #' },
          { property: 'address', header: 'Address' },
          { property: 'openedDate', header: 'Opened' },
          { property: 'closedDate', header: 'Closed' },
          { property: 'daysToResolve', header: 'Days to Resolve' },
          { property: 'outcome', header: 'Outcome' },
          { property: 'fineAmount', header: 'Fine Amt' },
          { property: 'officer', header: 'Officer' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Cases Closed', value: '9' },
        { label: 'Avg Days to Resolve', value: '18.4' },
        { label: 'Total Fines', value: '$3,250' },
        { label: 'Referred to Attorney', value: '1' }
      ]}
    ],
    data: {
      resolutions: [
        { caseNo: 'CE-2026-00188', address: '340 Linden Ave', openedDate: '02/02/2026', closedDate: '03/24/2026', daysToResolve: '50', outcome: 'Compliant — Fine Paid', fineAmount: '$500', officer: 'Ofc. Torres' },
        { caseNo: 'CE-2026-00201', address: '1660 Harbor View', openedDate: '02/09/2026', closedDate: '03/22/2026', daysToResolve: '41', outcome: 'Referred to City Attorney', fineAmount: '$1,200', officer: 'Ofc. Banks' },
        { caseNo: 'CE-2026-00215', address: '82 Sycamore Dr', openedDate: '02/12/2026', closedDate: '03/26/2026', daysToResolve: '42', outcome: 'Compliant — No Fine', fineAmount: '$0', officer: 'Ofc. Huang' },
        { caseNo: 'CE-2026-00234', address: '509 Grand Blvd', openedDate: '02/18/2026', closedDate: '03/25/2026', daysToResolve: '35', outcome: 'Abatement by City', fineAmount: '$800', officer: 'Ofc. Sullivan' },
        { caseNo: 'CE-2026-00248', address: '2775 Eastview Rd', openedDate: '02/22/2026', closedDate: '03/23/2026', daysToResolve: '29', outcome: 'Compliant — Fine Paid', fineAmount: '$250', officer: 'Ofc. Torres' },
        { caseNo: 'CE-2026-00263', address: '115 Cypress Court', openedDate: '02/28/2026', closedDate: '03/27/2026', daysToResolve: '27', outcome: 'Compliant — No Fine', fineAmount: '$0', officer: 'Ofc. Banks' },
        { caseNo: 'CE-2026-00272', address: '3388 River Bend Ln', openedDate: '03/04/2026', closedDate: '03/25/2026', daysToResolve: '21', outcome: 'Compliant — Fine Paid', fineAmount: '$350', officer: 'Ofc. Huang' },
        { caseNo: 'CE-2026-00289', address: '614 Poplar Street', openedDate: '03/08/2026', closedDate: '03/27/2026', daysToResolve: '19', outcome: 'Dismissed', fineAmount: '$0', officer: 'Ofc. Sullivan' },
        { caseNo: 'CE-2026-00298', address: '1900 Clover Hill Dr', openedDate: '03/12/2026', closedDate: '03/28/2026', daysToResolve: '16', outcome: 'Compliant — Fine Paid', fineAmount: '$150', officer: 'Ofc. Torres' }
      ]
    },
    matchKeywords: ['case resolution', 'closed cases', 'code enforcement outcomes', 'resolved violations', 'days to resolve', 'compliance outcomes', 'fines collected', 'abatement', 'weekly case summary', 'officer performance'],
    suggestions: ['Show only fined cases', 'Filter to Ofc. Banks', 'Show abatements only', 'Show referred to attorney', 'Export for weekly briefing']
  },

  // ── Financial (additional) ───────────────────────────────────────

  {
    id: 'general-ledger-summary',
    name: 'General Ledger Summary',
    description: 'Monthly general ledger summary by account, showing debit and credit activity, net movement, and running balance. Covers all funds and cost centers for the selected period.',
    domain: 'financial',
    badge: 'Standard Report',
    freshness: 'Updated monthly',
    parameters: [
      { id: 'period', label: 'Period', type: 'select',
        options: ['March 2026', 'February 2026', 'January 2026', 'Q3 FY 2025-2026'], default: 'March 2026' },
      { id: 'fund', label: 'Fund', type: 'select',
        options: ['All Funds', 'General Fund', 'Enterprise Fund', 'Capital Projects', 'Special Revenue'], default: 'All Funds' },
      { id: 'costCenter', label: 'Cost Center', type: 'select',
        options: ['All Cost Centers', 'Administration', 'Public Works', 'Police', 'Fire', 'Parks & Recreation'], default: 'All Cost Centers' },
      { id: 'accountType', label: 'Account Type', type: 'select',
        options: ['All Accounts', 'Revenue', 'Expenditure', 'Asset', 'Liability'], default: 'All Accounts' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Finance — Accounting' },
        { label: 'Period', value: 'March 2026' },
        { label: 'Generated', value: '04/01/2026 08:00 AM' },
        { label: 'Fund', value: 'All Funds' },
        { label: 'Cost Center', value: 'All Cost Centers' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'General Ledger — March 2026', dataKey: 'ledger',
        columns: [
          { property: 'accountNo', header: 'Account #' },
          { property: 'description', header: 'Description' },
          { property: 'fund', header: 'Fund' },
          { property: 'openingBalance', header: 'Opening Balance' },
          { property: 'totalDebits', header: 'Total Debits' },
          { property: 'totalCredits', header: 'Total Credits' },
          { property: 'netMovement', header: 'Net Movement' },
          { property: 'closingBalance', header: 'Closing Balance' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Debits', value: '$6,842,310' },
        { label: 'Total Credits', value: '$6,842,310' },
        { label: 'Net Movement', value: '$0' },
        { label: 'Accounts Reported', value: '9' }
      ]}
    ],
    data: {
      ledger: [
        { accountNo: '1010-100', description: 'Cash — General Checking', fund: 'General', openingBalance: '$4,215,820', totalDebits: '$1,842,100', totalCredits: '$1,645,300', netMovement: '+$196,800', closingBalance: '$4,412,620' },
        { accountNo: '1020-100', description: 'Accounts Receivable — Tax', fund: 'General', openingBalance: '$882,450', totalDebits: '$0', totalCredits: '$214,600', netMovement: '-$214,600', closingBalance: '$667,850' },
        { accountNo: '2010-100', description: 'Accounts Payable', fund: 'General', openingBalance: '$540,200', totalDebits: '$318,400', totalCredits: '$425,100', netMovement: '+$106,700', closingBalance: '$646,900' },
        { accountNo: '4010-200', description: 'Property Tax Revenue', fund: 'General', openingBalance: '$12,340,000', totalDebits: '$0', totalCredits: '$1,820,000', netMovement: '+$1,820,000', closingBalance: '$14,160,000' },
        { accountNo: '4020-200', description: 'Sales Tax Revenue', fund: 'General', openingBalance: '$6,880,000', totalDebits: '$0', totalCredits: '$980,400', netMovement: '+$980,400', closingBalance: '$7,860,400' },
        { accountNo: '5010-310', description: 'Personnel Services — Admin', fund: 'General', openingBalance: '$1,240,000', totalDebits: '$415,200', totalCredits: '$0', netMovement: '-$415,200', closingBalance: '$1,655,200' },
        { accountNo: '5020-320', description: 'Operations & Maintenance — PW', fund: 'General', openingBalance: '$980,000', totalDebits: '$302,600', totalCredits: '$0', netMovement: '-$302,600', closingBalance: '$1,282,600' },
        { accountNo: '6010-400', description: 'Capital Outlay — Infrastructure', fund: 'Capital Projects', openingBalance: '$3,500,000', totalDebits: '$841,800', totalCredits: '$0', netMovement: '-$841,800', closingBalance: '$4,341,800' },
        { accountNo: '7010-500', description: 'Debt Service — Principal', fund: 'Enterprise', openingBalance: '$8,200,000', totalDebits: '$122,210', totalCredits: '$0', netMovement: '-$122,210', closingBalance: '$8,322,210' }
      ]
    },
    matchKeywords: ['general ledger', 'GL summary', 'account balances', 'debit credit', 'monthly ledger', 'fund accounting', 'cost center', 'account activity', 'closing balance', 'ledger report'],
    suggestions: ['Show General Fund only', 'Filter to expenditure accounts', 'Show capital accounts', 'Filter to Public Works', 'Export for audit']
  },

  {
    id: 'revenue-recognition-report',
    name: 'Revenue Recognition Report',
    description: 'Monthly revenue recognition schedule by contract and revenue stream, detailing recognized and deferred amounts, contract period, and compliance with accrual accounting policies.',
    domain: 'financial',
    badge: 'Standard Report',
    freshness: 'Updated monthly',
    parameters: [
      { id: 'period', label: 'Period', type: 'select',
        options: ['March 2026', 'February 2026', 'January 2026', 'Q3 FY 2025-2026'], default: 'March 2026' },
      { id: 'revenueType', label: 'Revenue Type', type: 'select',
        options: ['All Types', 'Grant Revenue', 'Contract Services', 'Fee Revenue', 'Intergovernmental', 'Special Assessments'], default: 'All Types' },
      { id: 'recognitionStatus', label: 'Recognition Status', type: 'select',
        options: ['All Statuses', 'Fully Recognized', 'Partially Recognized', 'Deferred', 'Pending'], default: 'All Statuses' }
    ],
    sections: [
      { type: 'report-header', title: 'Report Details', fields: [
        { label: 'Department', value: 'Finance — Revenue Management' },
        { label: 'Period', value: 'March 2026' },
        { label: 'Generated', value: '04/01/2026 09:00 AM' },
        { label: 'Revenue Type', value: 'All Types' },
        { label: 'Recognition Status', value: 'All Statuses' },
        { label: 'Prepared By', value: 'System (Auto)' }
      ]},
      { type: 'table', title: 'Revenue Recognition Schedule — March 2026', dataKey: 'revenue',
        columns: [
          { property: 'contractNo', header: 'Contract #' },
          { property: 'description', header: 'Description' },
          { property: 'type', header: 'Revenue Type' },
          { property: 'contractPeriod', header: 'Contract Period' },
          { property: 'totalContractAmt', header: 'Total Amt' },
          { property: 'recognizedToDate', header: 'Recognized YTD' },
          { property: 'currentPeriod', header: 'Current Period' },
          { property: 'deferred', header: 'Deferred Balance' }
        ]
      },
      { type: 'summary-row', items: [
        { label: 'Total Contract Value', value: '$9,482,000' },
        { label: 'Recognized YTD', value: '$5,614,800' },
        { label: 'Current Period', value: '$842,200' },
        { label: 'Total Deferred', value: '$3,867,200' }
      ]}
    ],
    data: {
      revenue: [
        { contractNo: 'GR-2026-0041', description: 'CDBG — Infrastructure Improvements', type: 'Grant Revenue', contractPeriod: 'Jul 2025–Jun 2026', totalContractAmt: '$1,200,000', recognizedToDate: '$900,000', currentPeriod: '$100,000', deferred: '$300,000' },
        { contractNo: 'GR-2026-0048', description: 'JAG Grant — Law Enforcement Tech', type: 'Grant Revenue', contractPeriod: 'Oct 2025–Sep 2026', totalContractAmt: '$480,000', recognizedToDate: '$240,000', currentPeriod: '$40,000', deferred: '$240,000' },
        { contractNo: 'CS-2026-0112', description: 'IT Managed Services — Tyler Tech', type: 'Contract Services', contractPeriod: 'Jan 2026–Dec 2026', totalContractAmt: '$360,000', recognizedToDate: '$90,000', currentPeriod: '$30,000', deferred: '$270,000' },
        { contractNo: 'CS-2026-0118', description: 'Street Maintenance — LCRC', type: 'Contract Services', contractPeriod: 'Jan 2026–Jun 2026', totalContractAmt: '$620,000', recognizedToDate: '$310,000', currentPeriod: '$103,333', deferred: '$310,000' },
        { contractNo: 'FE-2026-0201', description: 'Development Impact Fees — Q3', type: 'Fee Revenue', contractPeriod: 'Jan–Mar 2026', totalContractAmt: '$842,000', recognizedToDate: '$842,000', currentPeriod: '$280,000', deferred: '$0' },
        { contractNo: 'IG-2025-0078', description: 'State Highway Fund Allocation', type: 'Intergovernmental', contractPeriod: 'Jul 2025–Jun 2026', totalContractAmt: '$3,200,000', recognizedToDate: '$1,600,000', currentPeriod: '$133,333', deferred: '$1,600,000' },
        { contractNo: 'IG-2025-0084', description: 'ARPA — Infrastructure Recovery', type: 'Intergovernmental', contractPeriod: 'Jul 2024–Jun 2027', totalContractAmt: '$1,800,000', recognizedToDate: '$600,000', currentPeriod: '$50,000', deferred: '$1,200,000' },
        { contractNo: 'SA-2026-0032', description: 'Street Lighting Assessment District', type: 'Special Assessments', contractPeriod: 'FY 2025-2026', totalContractAmt: '$480,000', recognizedToDate: '$360,000', currentPeriod: '$40,000', deferred: '$120,000' },
        { contractNo: 'SA-2026-0038', description: 'Landscape Maintenance District 4', type: 'Special Assessments', contractPeriod: 'FY 2025-2026', totalContractAmt: '$500,000', recognizedToDate: '$372,800', currentPeriod: '$65,534', deferred: '$127,200' }
      ]
    },
    matchKeywords: ['revenue recognition', 'deferred revenue', 'contract revenue', 'grant revenue', 'recognized vs deferred', 'revenue schedule', 'accrual accounting', 'special assessments', 'intergovernmental revenue', 'revenue report'],
    suggestions: ['Show grant revenue only', 'Filter to deferred only', 'Show fully recognized', 'Filter by revenue type', 'Export for external audit']
  },

  // ── Dashboard-Style Report ────────────────────────────────────────

  {
    id: 'budget-vs-actuals',
    name: 'Budget vs. Actuals',
    description: 'Year-to-date budget comparison with variance analysis by department and fund.',
    domain: 'financial',
    badge: 'Standard Report',
    freshness: 'Updated monthly',
    parameters: [
      { id: 'fiscalYear', label: 'Fiscal Year', type: 'select',
        options: ['FY 2025-2026', 'FY 2024-2025', 'FY 2023-2024'], default: 'FY 2025-2026' },
      { id: 'department', label: 'Department', type: 'select',
        options: ['All Departments', 'Public Works', 'Community Development', 'Police', 'Fire', 'Parks & Recreation'], default: 'All Departments' },
      { id: 'fund', label: 'Fund', type: 'select',
        options: ['All Funds', 'General Fund', 'Enterprise Fund', 'Capital Projects'], default: 'All Funds' },
      { id: 'category', label: 'Category', type: 'select',
        options: ['All Categories', 'Personnel', 'Operations', 'Capital'], default: 'All Categories' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Total Budget', value: '$48.2M', color: 'primary' },
        { label: 'YTD Actuals', value: '$32.1M', color: 'primary' },
        { label: 'Variance', value: '-$1.8M', color: 'danger' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Budget vs. Actuals by Department', dataKey: 'deptComparison' },
      { type: 'table', title: 'Department Detail', dataKey: 'departmentData',
        columns: [
          { property: 'department', header: 'Department' },
          { property: 'budget', header: 'Budget' },
          { property: 'actuals', header: 'Actuals' },
          { property: 'variance', header: 'Variance' }
        ]
      }
    ],
    data: {
      deptComparison: [
        { month: 'Public Works', value: 8200 },
        { month: 'Community Dev', value: 5400 },
        { month: 'Police', value: 12100 },
        { month: 'Fire', value: 9800 },
        { month: 'Parks & Rec', value: 3600 }
      ],
      departmentData: [
        { department: 'Public Works', budget: '$12.4M', actuals: '$8.2M', variance: '-$0.4M' },
        { department: 'Community Development', budget: '$6.8M', actuals: '$5.4M', variance: '+$0.2M' },
        { department: 'Police', budget: '$15.2M', actuals: '$12.1M', variance: '-$1.2M' },
        { department: 'Fire', budget: '$11.8M', actuals: '$9.8M', variance: '-$0.3M' },
        { department: 'Parks & Recreation', budget: '$5.0M', actuals: '$3.6M', variance: '-$0.1M' }
      ]
    },
    matchKeywords: ['budget', 'actuals', 'budget vs actuals', 'variance', 'fiscal year', 'spending', 'expenditure', 'department budget'],
    suggestions: ['Show my department only', 'Show personnel costs', 'Compare to last fiscal year', 'Show quarterly trend', 'Highlight over-budget items']
  }
];

export function getStandardReportById(id) {
  return standardReports.find(r => r.id === id) || null;
}
