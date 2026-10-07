export type Director = {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  documentType: string;
  documentNumber: string;
};

export const staffRoles = [
  'Assistente di parte',
  '1° dirigente',
  '2° dirigente',
  '3° dirigente',
  'Allenatore',
  'Medico sociale',
  'Addetto all’arbitro',
];

export function directorStaff(director: Director) {
  return {
    name: `${director.lastName} ${director.firstName}`,
    code: [
      director.code,
      director.documentNumber
        ? `${director.documentType || 'Documento'} ${director.documentNumber}`
        : '',
    ].filter(Boolean).join(' / '),
  };
}
