# Planejamento e Escopo — MySeizures

> Como planejar, fatiar e priorizar neste projeto. Derivado de `docs/instructions/8Rs.txt` (os 8 Rs,
> PGG e PGG Dominó) e aplicado ao sprint de outubro de 2026.
>
> **Status:** v1.0 · **Data:** 20/10/2026 · **Relacionado:** `docs/pmv-outubro-2026.md` ·
> `docs/plano-geral-outubro-2026.md`

---

## 1. O que é um projeto (e o que não é)

O 8Rs é para **projetos** — coisas de meses ou um trimestre. Acima disso existe *direção*; abaixo,
existem *problemas e ações do dia a dia*, que se resolvem fazendo.

**O teste é direto:** se dá para terminar esta semana sozinho, não é projeto — é tarefa, e
montar oito campos com dono, riscos e mitigantes para duas horas de trabalho é burocracia cara.

**No caso do MySeizures (sprint de 9 dias úteis):** está no **limite inferior**. É projeto porque
tem resultado mensurável (as SC), depende de pessoas externas (participantes do estudo) e não
pode ser entregue por conta própria. Mas o horizonte é curto o suficiente para que o documento
precise ser **executável sem perguntar nada** ao time — que é o objetivo do PMV.

> Coisas que **não** são projeto e não devem virar PMV: trocar a cor de um botão; refatorar um
> componente; escrever um teste unitário.

---

## 2. Calibração: quão irreversível é isto?

A primeira pergunta define quanto esforço o plano merece.

> **Se isso der errado, dá para voltar atrás? A que custo?**

| Reversibilidade | Modo | Como usar |
|---|---|---|
| **Reversível e barato** (padrão) | **Modo rápido** | O despejo vem bagunçado; o agente extrai o que der, preenche os 8 campos, marca `[a definir]` onde faltou, e faz **no máximo 2 perguntas** — só sobre o que é genuinamente impossível inferir (tipicamente o número do Resultado e o nome do Responsável) |
| **Irreversível ou caro** (mudar modelo de negócio, entrar em mercado novo, contratação de liderança) | **Modo guiado** | Uma pergunta por vez, na ordem dos 8 Rs, **esperando a resposta**. Sempre com a aposta junto: *"aposto que o gargalo aqui é X, me corrige"* |

Perguntar sozinho vira formulário e o dono abandona no terceiro campo. **Perguntar com hipótese vira
conversa**, e ele corrige em segundos o que levaria minutos para formular do zero.

Diga qual modo você vai usar e por quê, em uma linha, e ofereça o outro.

> **Aplicado ao MySeizures:** modo **rápido** para o sprint de interface (reversível e barato) e modo
> **guiado** para o estudo de usabilidade (depende de recrutamento de terceiros e do aval do comitê
> de ética).

---

## 3. PGG — Projeto Ganha-Ganha

Um bom projeto é um **PGG**: você vence mesmo perdendo, porque aprende; e vence mais ganhando.

| Característica | Teste |
|---|---|
| **Controlável** | As ações estão sob seu controle. "Fechar 25 clientes" não é; "enviar 100 propostas" é |
| **Corajoso** | O resultado é ambicioso, não morno |
| **Conciso** | No máximo três meses. Prazo é função de distância: longe demais fica turvo |
| **Comprometido** | Existe compromisso público ou social atrelado à parte controlável — algo que cria pressão real |

**Template:**

> **Conjunto Controlável de ações que levam a um resultado Corajoso num prazo Conciso,
> Comprometido por um compromisso público.**

**Aplicado a este projeto:**

> *Refatorar 9 telas do MySeizures (de 2 telas de entrada e 4 fluxos medidos) em 9 dias úteis,
> para 90% dos pacientes registrarem uma crise em menos de 60 segundos e 100% dos profissionais
> encontrarem alertas e adesão em menos de 1 minuto, vinculado a um compromisso público de entrega
> em 31/10/2026 e de publicação de resultados em novembro de 2026.*

**Onde os projetos morrem:** exatamente onde faltam coragem, prazo ou compromisso. Se o PGG não
fecha, o plano não fecha.

---

## 4. PGG Dominó — a ordem de priorities

Quando há vários candidatos, três perguntas:

1. **Se eu acertar só um**, qual destrava todos os outros?
2. **Qual, se feito primeiro,** deixa os demais mais fáceis ou desnecessários?
3. **Se eu NÃO fizer qual,** os outros paralisam?

O projeto que responde às três é o **Dominó** — é onde se coloca energia primeiro. É comum um
projeto tornar outro irrelevante.

> **Resposta para o MySeizures:** o **design system + a home com captura rápida**.
> Sem ele, nenhuma tela nova nasce consistente e o teste de usabilidade mede uma colcha de
> retalhos. E é por isso que o sprint começa pelos documentos e pelos tokens, e não pelas telas.

**Aplicação prática da regra 2 — matar tarefas:** "registro de auras como entidade independente"
torna-se irrelevante quando se implementa `feltAura` na crise. "Diário diário de sono/humor" torna-se
irrelevante porque o gatilho já captura sono e humor. **Matar uma tarefa vale tanto quanto
priorizar uma** — e registrar a morte na matriz é mais honesto que implementá-la pela metade.

---

## 5. Os 8 Rs — checklist de preenchimento

| R | Campo | Pergunta-chave | Erro a evitar |
|---|---|---|---|
| R1 | **Resultado** | Qual resultado, em que prazo, e **como vou saber que cheguei**? | Se a 3ª pergunta não tem resposta, o resultado ainda é vago |
| R2 | **Razão** | Por que importa, e **por que agora**? | Várias razões são relevantes; identifique a principal e pergunte: *essa razão atravessa o primeiro obstáculo?* |
| R3 | **Referência** | Quem já fez parecido? (PEGE: Princípios · Exemplos · Guias · Experts) | **Referência inventada é pior que nenhuma.** Descreva o padrão sem batizar ninguém, se não tiver certeza |
| R4 | **Rumo** | 5–7 marcos em ordem, com ideias e questões | Listar 20 itens = zoom errado. Marcos, não microtarefas |
| R5 | **Recursos** | Dinheiro · material · pessoas · informação. E: **dá para emprestar, trocar ou alugar?** | Assumir comprar por padrão. Desafio: *como rodaria com o máximo de recursos emprestados?* |
| R6 | **Restrições** | **O que não estou disposto a sacrificar?** | Entender restrição como escopo. A pergunta real: *o que faria o sucesso parecer um fracasso?* |
| R7 | **Riscos** | **Pré-mortem**: é daqui a 3 meses e fracassou — o que deu errado? | Risco sem mitigante é ansiedade documentada. **Todo pior caso precisa de plano B** |
| R8 | **Responsável** | Um dono. E o dono de cada etapa, com prazo | Projeto com dois donos não tem dono. Valide cada um em **capacidade, disponibilidade e vontade** — as três precisam ser sim |

---

## 6. O que entrego

Um documento de **uma a duas páginas**, nesta ordem, consultável e atualizável:

```
PROJETO: [nome curto]
PGG: [uma frase, no template]
Irreversibilidade: [reversível e barato / irreversível ou caro]

R1  RESULTADO     [o quê, prazo, como saberei que cheguei]
R2  RAZÃO         [razão principal, e por que agora]
R3  REFERÊNCIA    [princípios · exemplos · guias · experts]
R4  RUMO          [5 a 7 etapas · ideias · questões em aberto]
R5  RECURSOS      [dinheiro · material · pessoas · informação, com emprestar/trocar/alugar/comprar]
R6  RESTRIÇÕES    [o que não será sacrificado]
R7  RISCOS        [risco → probabilidade → impacto → mitigação]
R8  RESPONSÁVEL   [dono do projeto, e dono de cada etapa com prazo]

PRÓXIMOS 3 PASSOS
1. [ação concreta desta semana]
2. [...]
3. [...]
```

Onde faltou informação: **`[a definir]` com uma sugestão entre parênteses**. Nunca preencha com um
dado plausível — **um número inventado num plano vira meta real na cabeça do time**, e ninguém se
lembra depois que era chute.

---

## 7. Fatias verticais, não camadas

**Regra do incremento demonstrável:** toda entrega termina **funcionando e demonstrável**. Não
existe "camada de dados pronta, falta a tela" como estado de entrega.

| ❌ Fatia por camada | ✅ Fatia vertical |
|---|---|
| "criar todos os repositórios" | "registrar uma crise na home, do toque ao dado salvo" |
| "fazer o design system inteiro" | "tokens + `Button` + `Card`, e a home do paciente com eles" |
| "fazer todas as telas" | "a home + o form de crise (a SC-001) e nada mais" |

**Ordem de implementação por dependência** (não por camada): tokens → primitivas → navegação →
telas. Cada passo é um commit, um vídeo e um `npm test` verde.

---

## 8. Rubrica de prioridade para aperto de prazo

Quando não couber tudo, a ordem de sacrifício é **explícita**, não improvisada:

| # | Critério | Peso |
|---|---|---|
| 1 | **Impacto numa SC medida** — o estudo de novembro depende | **Altíssimo** |
| 2 | **Custo de reversão** — o que é barato de desfazer fica para o fim | Alto |
| 3 | **Diferenciação na matriz** — a linha onde todos os concorrentes são ❌ | Médio |
| 4 | **Polimento visual** — o que só aparece na defense | Baixo |

**Regra derivada:** *a interface bonita que não passa a SC-001 é menos valuable que a interface
simples que passa.*

**Sacrifício explícito, em ordem** (nunca negociável, nunca implícito):
1. Telas de verificação do arquivo exportado
2. `Undo` / rascunho
3. Descrição de crises e pessoa de contato
4. Métrica de auras
5. Diário diário de sono/humor — nunca coube

---

## 9. Definition of Done (do projeto)

Uma feature só está pronta quando **todas** as caixas estão marcadas:

- [ ] `npm run lint` verde
- [ ] `npm run format:check` verde
- [ ] `npm test` verde, com **teste novo** para o comportamento novo
- [ ] Critério de aceitação da spec **demonstrado**, não apenas implementado
- [ ] Acessibilidade: papéis, rótulos, estados, alvos ≥ 48 dp, status não só por cor
- [ ] Estados `loading` / `empty` / `error` / `forbidden` tratados
- [ ] Documentação atualizada; ADR quando a decisão for estrutural
- [ ] Evidência anexada (print, vídeo, saída de teste)
- [ ] Rastreabilidade atualizada (`specs/.../traceability.md` e `validation.md`)
- [ ] O que ficou fora está escrito como **"trabalhos futuros"**, não omitido

> *"Nenhuma feature está concluída sem que todos os critérios de aceitação declarados estejam
> demonstravelmente atendidos."* — Princípio 3 da constituição do projeto.

---

## 10. Ritmo de trabalho

| Frequência | Artefato | Duração |
|---|---|---|
| **Diária** | Incremento demonstrável + `lint`/`format`/`test` verdes | fim do dia |
| **A cada etapa** (E1–E7) | Demo de 5 min ao orientador | 15 min |
| **Semanal** | Revisão do PMV: riscos novos, itens `[a definir]` resolvidos | 30 min |
| **Antes da entrega** | Revisão completa da rastreabilidade + evidências | 1 dia |

**Regra do bloqueio:** nenhuma pergunta parada bloqueia a sprint. Na ausência de resposta, aplica-se
o **default documentado** e segue-se; a pergunta vai para a lista de pendências
(`docs/plano-geral-outubro-2026.md` §12).
