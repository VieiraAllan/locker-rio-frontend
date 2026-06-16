function LockerCard({
  numero,
  status,
  onClick,
  exibirAcaoManutencao = false,
  textoAcaoManutencao = '',
  onAcaoManutencao = null,
  desabilitarAcaoManutencao = false
}) {
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

      {exibirAcaoManutencao && textoAcaoManutencao && onAcaoManutencao && (
        <button
          type="button"
          className="locker-manutencao-btn"
          onClick={event => {
            event.stopPropagation();
            onAcaoManutencao();
          }}
          disabled={desabilitarAcaoManutencao}
        >
          {textoAcaoManutencao}
        </button>
      )}
    </div>
  );
}

export default LockerCard;