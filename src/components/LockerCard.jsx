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

  const iconeAcao =
    status === 'manutencao'
      ? '↻'
      : '🛠';

  return (
    <div
      className={`locker-card ${status}`}
      onClick={onClick}
    >
      {exibirAcaoManutencao && textoAcaoManutencao && onAcaoManutencao && (
        <button
          type="button"
          className={`locker-manutencao-icon-btn ${
            status === 'manutencao' ? 'reativar' : 'manutencao'
          }`}
          title={textoAcaoManutencao}
          aria-label={textoAcaoManutencao}
          onClick={event => {
            event.stopPropagation();
            onAcaoManutencao();
          }}
          disabled={desabilitarAcaoManutencao}
        >
          {iconeAcao}
        </button>
      )}

      <div className="locker-numero">{numero}</div>
      <div className="locker-status">{statusLabel[status]}</div>
    </div>
  );
}

export default LockerCard;