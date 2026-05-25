function LockerCard({ numero, status, onClick }) {
  const statusLabel = {
    disponivel: 'Disponível',
    ocupado: 'Ocupado',
    manutencao: 'Manutenção'
  };

  return (
    <div
      className={`locker-card ${status}`}
      onClick={onClick}
    >
      <div className="locker-numero">{numero}</div>
      <div className="locker-status">{statusLabel[status]}</div>
    </div>
  );
}

export default LockerCard;