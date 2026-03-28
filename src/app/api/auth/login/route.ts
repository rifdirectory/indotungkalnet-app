import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    // 1. Try Admin (users table)
    let results: any = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    let user = results[0];
    let role = user?.role || 'admin';
    let userId = user?.id;
    let found = !!user;

    // 2. Try Employee (employees table) if not found in users
    if (!found) {
      results = await db.query(
        `SELECT e.*, p.name as position_name 
         FROM employees e 
         LEFT JOIN positions p ON e.position_id = p.id 
         WHERE e.employee_code = ? AND e.status = 'active'`, 
        [username]
      );
      user = results[0];
      if (user) {
        role = 'employee';
        userId = user.id;
        found = true;
      }
    }

    if (!found) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password (works for both users.password_hash and employees.password)
    const storedHash = user.password_hash || user.password;
    const isPasswordValid = await bcrypt.compare(password, storedHash || '');

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Set JWT cookie session
    // We use full_name for employees as their "username" in the session for display
    await createSession(userId, user.username || user.full_name, role);

    return NextResponse.json({ 
      success: true, 
      user: { id: userId, username: user.username || user.full_name, role: role } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
