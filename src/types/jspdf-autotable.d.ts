declare module 'jspdf-autotable' {
  function autoTable(columns: any, rows: any): void;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    }
  }