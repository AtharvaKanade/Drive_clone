export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export function canRead(role: Role): boolean {
  return role === 'OWNER' || role === 'EDITOR' || role === 'VIEWER';
}

export function canWrite(role: Role): boolean {
  return role === 'OWNER' || role === 'EDITOR';
}


