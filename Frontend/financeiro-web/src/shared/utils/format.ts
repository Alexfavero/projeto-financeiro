export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata uma data ISO (yyyy-MM-dd ou com horário) como dd/mm/aaaa. */
export function formatData(iso: string): string {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR");
}

/** yyyy-MM-dd de hoje, no fuso local — útil como default de formulário/filtro. */
export function hojeISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** yyyy-MM-dd de hoje +/- N dias, no fuso local. */
export function dataISOMaisDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Primeiro dia (yyyy-MM-dd) do mês corrente. */
export function primeiroDiaMesISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

/** Último dia (yyyy-MM-dd) do mês corrente. */
export function ultimoDiaMesISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

/** Soma `dias` a uma data ISO (yyyy-MM-dd), no fuso local. */
export function addDiasISO(dataISO: string, dias: number): string {
  const d = new Date(dataISO + "T00:00:00");
  d.setDate(d.getDate() + dias);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
