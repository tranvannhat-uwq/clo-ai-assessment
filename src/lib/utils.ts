export const formatScheduleList = (str: string | any) => {
  if (!str) return '';
  try {
    const parsed = typeof str === 'string' ? JSON.parse(str) : str;
    if (Array.isArray(parsed)) {
      return parsed.map(p => {
         let dateStr = ''
         if (p.date) {
           const parts = p.date.split('-') // YYYY-MM-DD
           if (parts.length === 3) dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`
           else dateStr = p.date
         } else if (p.dayOfWeek) {
           const daysMap: any = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' }
           dateStr = daysMap[p.dayOfWeek] || ''
         }
         return `${dateStr} (${p.startPeriod}-${p.endPeriod}) [${p.room}]`
      }).join(', ')
    }
  } catch (e) {
    return String(str);
  }
  return String(str);
}
