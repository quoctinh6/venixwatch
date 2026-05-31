export function formatInputWithSelection(input, isPercentage = false) {
  const value = input.value;
  const selectionStart = input.selectionStart;
  
  let digitsBeforeCursor = 0;
  for (let i = 0; i < selectionStart; i++) {
    if (/\d/.test(value[i])) {
      digitsBeforeCursor++;
    }
  }
  
  let digits = value.replace(/\D/g, '');
  if (!digits) {
    input.value = '';
    return;
  }
  
  let formatted = '';
  if (isPercentage) {
    let num = Math.min(100, parseInt(digits, 10) || 0);
    formatted = num + '%';
  } else {
    formatted = Number(digits).toLocaleString('vi-VN') + 'đ';
  }
  
  input.value = formatted;
  
  let newCursorPos = 0;
  let digitsCount = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digitsCount++;
      if (digitsCount === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
  }
  
  if (digitsCount < digitsBeforeCursor || newCursorPos === 0) {
    newCursorPos = formatted.length - 1;
  }
  if (newCursorPos > formatted.length - 1) {
    newCursorPos = formatted.length - 1;
  }
  
  input.setSelectionRange(newCursorPos, newCursorPos);
}
