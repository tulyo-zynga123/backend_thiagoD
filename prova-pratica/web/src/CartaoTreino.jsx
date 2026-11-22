// ---------------------------------------------------------------
// TAREFA 4: um componente que desenha UM treino da lista.
//
// Ele recebe tudo por props (nada de buscar dado aqui dentro):
//   treino      -> { id, nome, duracao, concluido }
//   onConcluir  -> funcao, chamada com o id do treino
//   onApagar    -> funcao, chamada com o id do treino
//
// O que precisa aparecer:
//   - o nome do treino e a duracao ("30 min")
//   - se concluido: um selo com a palavra "concluído"
//     (className="selo feito") e SEM o botao Concluir
//   - se nao concluido: o botao Concluir
//   - sempre: o botao Apagar
//
// Dicas:
//   - desestruture as props na assinatura: ({ treino, onConcluir, onApagar })
//   - o SQLite devolve concluido como 0 ou 1; Boolean(treino.concluido)
//     deixa a condicao segura
//   - cuidado com {treino.concluido && ...}: se o valor for 0, o React
//     escreve um 0 na tela
//   - onClick={() => onConcluir(treino.id)}  (e nao onClick={onConcluir(...)})
//   - classes de estilo ja prontas: "item", "item-info", "suave", "acoes",
//     "secundario", "perigo", "selo", "feito"
//
// Abaixo tem so um esqueleto que mostra o nome, para o build funcionar.
// ---------------------------------------------------------------
export default function CartaoTreino(props) {
  return (
    <li className="item">
      <div className="item-info">
        <strong>{props.treino.nome}</strong>
      </div>
    </li>
  );
}
