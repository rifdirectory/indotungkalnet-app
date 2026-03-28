import mysql from 'mysql2/promise';

const employeeData = `
001-2024-ITN	Arifin Ahmad	 NOC 	  4.500.000 	  500.000 	  400.000 	  400.000 	  200.000 	  80.000 
002-2024-ITN	Wisnu Rachmawan	 Research & Development 	  5.500.000 	  500.000 	  400.000 	  400.000 	  200.000 	  140.000 
003-2024-ITN	Sopiansyah	 Infra dan komersial 	  2.500.000 	  500.000 	  400.000 	  400.000 	  200.000 	  70.000 
004-2024-ITN	Ria Puspitasari	 SPV Office 	  3.000.000 	  500.000 	  400.000 	  400.000 	  200.000 	  60.000 
005-2024-ITN	Amiril Mukminin	 Operator Logistik 	  1.500.000 	  -   	  400.000 	  400.000 	  200.000 	  50.000 
006-2024-ITN	M. Rehal Adriant	 Teknisi 	  1.500.000 		  400.000 	  400.000 	  200.000 	  60.000 
007-2024-ITN	Sudirmansyah	 SPV Teknisi 	  1.500.000 	  500.000 	  400.000 	  400.000 	  200.000 	  50.000 
008-2024-ITN	M. Darussalam	 Teknisi 	  1.500.000 	  -   	  400.000 	  400.000 	  200.000 	  50.000 
009-2024-ITN	Mirwansyah	 Teknisi 	  1.500.000 	  -   	  400.000 	  400.000 	  200.000 	  50.000 
010-2024-ITN	Syarkawi	 Support admin 	  1.500.000 	  -   	  400.000 	  400.000 	  200.000 	  50.000 
011-2024-ITN	Baso Abdul Hamit	 ITLog 	  1.500.000 	  500.000 	  400.000 	  400.000 	  200.000 	  -   
012-2024-ITN	Nurani Mila Utami	 Support admin 	  1.500.000 		  400.000 	  400.000 	  200.000 	  50.000 
013-2024-ITN	Eriyadi	 Teknisi 	  1.500.000 		  400.000 	  400.000 	  200.000 	  50.000 
014-2024-ITN	Rita Zahara	 Cleaning Service 	  500.000 					0 
`;

async function migrateSalaries() {
  console.log('🚀 Starting Salary Migration to Positions...');

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'advance',
    database: 'indotungkal_db'
  });

  const lines = employeeData.trim().split('\n');
  const positionSalaries = new Map();

  const parseNum = (val) => {
    if (!val || val === '-' || val === '0' || val.trim() === '') return 0;
    return parseFloat(val.replace(/\./g, '').replace(/,/g, '').trim()) || 0;
  };

  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    if (parts.length < 3) continue;

    const posName = parts[2];
    const basic = parseNum(parts[3]);
    const allowanceP = parseNum(parts[4]);
    const allowanceT = parseNum(parts[5]);
    const allowanceM = parseNum(parts[6]);
    const allowancePr = parseNum(parts[7]);
    const deductionB = parseNum(parts[8]);

    // If we haven't stored this position yet, store it
    if (!positionSalaries.has(posName)) {
      positionSalaries.set(posName, {
        basic,
        allowanceP,
        allowanceT,
        allowanceM,
        allowancePr,
        deductionB
      });
    }
  }

  for (const [posName, salary] of positionSalaries.entries()) {
    console.log(`⏳ Updating Position: ${posName}...`);
    
    await conn.query(`
      UPDATE positions SET 
        basic_salary = ?, 
        allowance_pos = ?, 
        allowance_trans = ?, 
        allowance_meal = ?, 
        allowance_presence = ?, 
        deduction_bpjs = ? 
      WHERE name = ?
    `, [
      salary.basic, 
      salary.allowanceP, 
      salary.allowanceT, 
      salary.allowanceM, 
      salary.allowancePr, 
      salary.deductionB, 
      posName
    ]);
  }

  console.log('🎉 Salary migration complete!');
  await conn.end();
}

migrateSalaries();
