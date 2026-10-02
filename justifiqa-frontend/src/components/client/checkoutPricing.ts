export const formatCurrency = (value: number) => value === 0 ? 'Rp 0' : `Rp ${value.toLocaleString('id-ID')}`;

export const getEscrowTotal = (value: number) => value === 0 ? 0 : value + Math.round(value * 0.11);
