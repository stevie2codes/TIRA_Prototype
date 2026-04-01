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
