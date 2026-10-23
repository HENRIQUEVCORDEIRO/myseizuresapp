# PMV — Sprint de rework de interface (outubro/2026)

> **Plano Mínimo Viável** no formato dos 8 Rs (`docs/instructions/8Rs.txt`).
> Onde a informação não existe, está marcado como `[a definir]` com a sugestão entre parênteses.
>
> **Status:** v1.0 · **Data:** 20/10/2026 · **Dono:** Henrique Cordeiro
> **Relacionado:** `docs/plano-geral-outubro-2026.md` · `docs/visual-design-system.md` ·
> `docs/usability-study-protocol.md`

---

```
PROJETO:   MySeizures v1 — rework de interface de baixo esforço
PGG:       Refatorar 9 telas do MySeizures (de 2 telas de entrada e 4 fluxos medidos) em
           9 dias úteis, para 90% dos pacientes registrarem uma crise em menos de 60 segundos
           e 100% dos profissionais encontrarem alertas e adesão em menos de 1 minuto,
          vinculado a um compromisso público de entrega em 31/10/2026 e de publicação de
           resultados em novembro de 2026.
Irreversibilidade: reversível e barato — o rework é restrito à camada de apresentação;
           o domínio, a persistência, a API e os testes existentes permanecem intocados.
```

---

## R1 · RESULTADO

**O quê:** um MySeizures demonstrável, com interface de baixo esforço, em que:

1. **SC-001** — 90% dos participantes registram uma crise com todos os detalhes em **< 60 s**;
2. **SC-002** — 90% criam um tratamento e confirmam a dose em **< 2 min**;
3. **SC-003** — 100% dos profissionais encontram alertas e adesão em **< 1 min**;
4. **SC-004** — 100% dos acessos são negados após revogação, sem revelar dados;
5. **SC-005** — 100% dos registros offline sobrevivem à reabertura do app;
6. A matriz de concorrência pode ser apresentada em **dois níveis** (visão do produto × estado da
   v1), com todas as afirmações verificáveis no código.

**Em que prazo:** entrega da versão demonstrável em **31/10/2026** (último dia útil: 30/10);
estudo de usabilidade e coleta de resultados em **novembro/2026**; defesa em **dezembro/2026**.

**Como vou saber que cheguei:**
- `npm run lint`, `npm run format:check` e `npm test` verdes (baseline atual: 41 suítes, ~219
  testes mobile + 17 API);
- os três fluxos gravados em vídeo, um por tarefa medida;
- planilha de resultados do estudo com o veredito de cada SC;
- `validation.md` e `traceability.md` atualizados com o estado real de 30/10.

---

## R2 · RAZÃO

**Por que isso importa:**

1. **A tese do TCC** — a proposta do MySeizures é ser o único app que reúne o conjunto completo
   de funcionalidades *e* tem interface de baixo esforço. Sem a interface, a tese não se sustenta.
2. **A avaliação do orientador** — a conclusão de que o projeto está distante da proposta se
   sustenta no que é visível na tela. Interface é o que se demonstra em 3 minutos de defesa.
3. **O artigo** — está sem a seção de resultados. Os testes de usabilidade são o único caminho
   curto para obtê-la.

**Por que agora:** o prazo de 31/10 é o último ponto em que uma entrega nova ainda produz
resultados em novembro. Depois disso, o artigo teria de descrever um sistema sem medição.

**Razão principal:** *o trabalho de campo de novembro exige um produto que os participantes
consigam usar sem treinamento.*

**Essa razão atravessa o primeiro obstáculo?** Sim. O primeiro obstáculo previsível é a
reconstrução do ambiente de desenvolvimento (já happened nos commits `f496efd` e `4d6a59b`).
Contra-obstáculo: **D1 valida o build Android antes de qualquer refatoração**; se o build não
sober, o sprint é re-planejado para o simulador e o estudo de usabilidade passa a ser conduzido
em dispositivo de teste com build de desenvolvimento, nunca em Expo Go.

---

## R3 · REFERÊNCIA (PEGE)

**Princípios**
- ISO 9241-11 (2018) — usabilidade: eficiência, eficácia e satisfação.
- ISO 9241-210 (2019) — experiência do usuário, com um conceito mais amplo que usabilidade.
- Shneiderman (1986) — 8 regras de ouro; Nielsen (1995) — 10 heurísticas.
- Norman (1988) — affordance real × percebido; **Gomes (2000)**, via Grilo cap. 3.
- Grilo, A. *Experiência do Usuário em Interfaces Digitais*. EDUFRN/UFRN — carga cognitiva,
  acessibilidade, linguagem e comunicação.
- Princípios próprios já vigentes: `docs/adr/0001` (dados clínicos locais) e `docs/adr/0002`
  (relatórios derivados, alertas versionados, export local).

**Exemplos**
- Diretos (mesmo setor): **Seizure Tracker**, **Epilepsy Journal**, **Epsy**, **Epistemic** — a
  matriz em `docs/fix_pesquisa_TCC.pdf`.
- Indireto (o "ouro" está no outro setor): o app de referência "Help epilepsy"
  (`docs/Fluxo - outro app epilepsia/`) — **padrões de interação**, não identidade visual.
- Do próprio projeto: a spec `001-manage-epilepsy-care` e os 41 testes já existentes.

**Guias**
- `docs/EBook - Experiencia_do_Usuario_em_Interfaces_Digitais.pdf`
- `docs/instructions/Expert de Desenvolvimento.pdf` — convenções de especificação.
- WCAG 2.2 (W3C) — acessibilidade.

**Experts**
- **Don Norman** (NN/g) — affordance, design de interação, erros.
- **Jakob Nielsen** (NN/g) — heurísticas e avaliação heurística.

> Regra do kit: *referência inventada é pior que nenhuma referência.* Tudo acima existe e é
> verificável. Onde há dúvida, descrever o padrão sem batizar ninguém.

---

## R4 · RUMO

### Etapas (7 marcos, em ordem cronológica)

| # | Etapa | Prazo | Critério de pronto |
|---|---|---|---|
| E1 | Fundação visual: tokens, primitivas, documentos de design | 20/10 | `tokens.js` + 10 primitivas com teste; 11 documentos em `docs/` |
| E2 | Navegação e home do paciente | 21/10 | 4 abas; home com 3 ações, gráfico semanal e atalhos |
| E3 | Formulários de crise e gatilho | 22–23/10 | Crise em ≤ 4 toques; gatilho com seleção múltipla e "Other" condicional |
| E4 | Assistente de tratamento (3 passos) | 26/10 | Sem `baseTimes.join(', ')`; dose confirmável em 1 toque na home |
| E5 | Home do profissional + relatório unificado | 27–28/10 | Lista de pacientes autorizados; relatório com export embutido |
| E6 | Resiliência, acessibilidade e rede de apoio | 29/10 | Sessão 100% offline; rascunho + `Undo`; checklist a11y aprovado; descrição de crises + contato |
| E7 | Buffer, evidência e entrega | 30/10 | lint/format/test verdes; build de dev; vídeos dos 3 fluxos; protocolo de usabilidade + TCLE prontos |

### Ideias (brainstorm por etapa — ainda não são decisões)

- **E1** — a home poderia ter um "resumo do dia" com um único botão "estou bem" (registro negativo
  rápido). *Não decidido: exige estado novo.*
- **E3** — registrar a crise por **notificação** ("acabei de ter uma crise" → abre o form
  pré-preenchido). *Não decidido: o SDK de notificações interativo é frágil; arriscado no prazo.*
- **E4** — atalhos de horário ("Manhã", "Almoço", "Noite") além do picker. *Decidido: entra em E4.*
- **E5** — a home do profissional poderia mostrar **últimos pacientes acessados**. *Não decidido:
  exige estado local do profissional.*
- **E6** — notificação local ao profissional quando um novo período fecha. *Descartado: alerta
  clínico em notificação é proibido pelo ADR 0002; e não há sincronização entre dispositivos.*

### Questões (a resolver)

1. O **N** do estudo de usabilidade é viável com o recrutamento disponível? (impacto direto no
   desenho do resultado — `docs/usability-study-protocol.md` §3)
2. Existe **aparelho Android físico** disponível para o estudo, ou o teste roda no simulador?
   (define se a entrega de notificação nativa pode ser verificada)
3. Há **modelo institucional de TCLE** ou é preciso usar o modelo genérico da §9 do protocolo?
4. O **orientador** prefere ver o PMV e o reframe da matriz antes ou depois de E3?
5. O artigo tem **formato e número de páginas** definidos?

---

## R5 · RECURSOS

**Dinheiro** — R$ 0. Nenhuma contratação, nenhum serviço pago, nenhuma API externa.
*(Se houver compensação a participantes: `[a definir]` — se houver, deve ser igual para todos e
declarada no artigo.)*

**Material**
- Aparelho Android físico com development build — *disponível?* `[a definir]`
- Gravador de tela e áudio do próprio aparelho
- Impressora para roteiro, TCLE e SUS (ou equivalente em PDF)

**Pessoas**
- **1 dono**: Henrique Cordeiro (autor) — único responsável pelo produto, pelo conteúdo e pela
  escrita.
- **1 orientador**: revisão e validação de escopo. Papel: aprovar o reframe da matriz e o PMV.
  Prazo: até E2.
- **Participantes do estudo**: 5–8 pacientes + 2–3 profissionais — *disponibilidade* `[a definir]`.
- **Ninguém mais.** Não há time, não há designer, não há devs terceirizados.

**Informação**
- A matriz de concorrência (`docs/fix_pesquisa_TCC.pdf`)
- O eBook de UX (Grilo, EDUFRN/UFRN)
- 31 capturas do app de referência
- A spec `001-manage-epilepsy-care`, os 2 ADRs e os 41 testes existentes
- **Documentos oficiais**: RNDS e e-SUS — para sustentar tecnicamente a linha de interoperabilidade
  `[a definir: consultar a documentação oficial do RNDS no portal do Ministério da Saúde]`

**O desafio do 8Rs — como este projeto rodaria com o máximo de recursos emprestados?**
> Ele rodaria **inteiramente com o que já existe**: a arquitetura, a API simulada, os 41 testes, o
> eBook, a matriz e as capturas de referência. Nenhuma dependência nova, nenhum serviço novo, nenhum
> banco de dados novo. O único recurso verdadeiramente escasso é **tempo do dono** — e é por isso
> que a ordem das etapas segue o PGG Dominó e que o incremento demonstrável é regra dura.

---

## R6 · RESTRIÇÕES

**O que não estou disposto a sacrificar pelo sucesso deste projeto:**

1. **A honestidade da proposição.** Nenhuma linha da matriz será marcada como implementada sem que
   o código a sustente. É a primeira vez que este projeto tropeça numa restrição, e é justamente
   por isso que ele tropeçou: a matriz original prometia 13/13.
2. **Os dados clínicos locais.** Nenhuma feature nova pode levar dado clínico para fora do
   dispositivo (ADR 0001). Nenhuma sincronização em nuvem, nenhum push remoto.
3. **A natureza informativa dos alertas.** Nenhuma regra nova vira diagnóstico, previsão de crise ou
   escalonamento de emergência (ADR 0002). Regras novas exigem versão nova e teste de fronteira.
4. **A acessibilidade.** Nenhuma entrega pode reduzir o nível de acessibilidade já existente.
   Regressão de acessibilidade é bug, não dívida.
5. **A qualidade do código existente.** Não se reescreve o que está correto para "ficar bonito".
   Domínio, persistência e API ficam intactos.
6. **O meu descanso e a minha saúde.** A sprint é de 9 dias úteis, não de 9 dias contínuos.
   *"O que faria o sucesso parecer um fracasso?"* — entregar no dia 31 destruído e sem
   escrever o artigo é fracasso.

**Restrição positiva:** o processo precisa ser executável de forma que **cada dia termine com algo
funcionando** — nada de meia-feature que só compila às 23h.

---

## R7 · RISCOS (pré-mortem)

> *É dia 30 de outubro de 2026. Este projeto fracassou completamente. Escreva o relatório da
> falha. O que deu errado?*

| # | Cenário de falha | Prob. | Impacto | Mitigante (plano B) |
|---|---|---|---|---|
| R1 | O build de desenvolvimento Android não sobe (Codegen, `react-native-screens`, gradle) | média | **alto** | Validar o build no **D1, antes de qualquer código**. Se falhar: conduzir o estudo no simulador e adiar a verificação de notificação nativa para depois de 31/10. **Não atualizar dependências** (precedente `f496efd`) |
| R2 | A reescrita das telas quebra a suíte de apresentação (7 arquivos) e consome o fim de semana | alta | médio | 2 h reservadas no D9; reescrever os testes **junto** da tela, não depois; commit por primitiva, nunca "depois eu corrijo" |
| R3 | Escopo cresce e a sprint estoura (a tentação de implementar tudo da matriz) | alta | **alto** | A §4 do plano geral fixa o que está dentro e o que está fora. Qualquer item fora vira **"trabalhos futuros"** escrito, não tarefa |
| R4 | O estudo de usabilidade não recruta participantes a tempo | média | **alto** (o artigo fica sem resultados) | Recrutar **antes** de D9, não depois. Se o N for insuficiente, reportar como estudo exploratório qualitativo, com honestidade declarada |
| R5 | A interface fica "bonita" mas a tarefa A continua > 60 s | média | **alto** | O critério não é o design system, é o **número de toques**. A Tarefa A tem orçamento de 4 toques. Medir com o cronômetro antes de polir |
| R6 | O tempo do dono é consumido por dúvidas recorrentes ao orientador | média | médio | Todas as decisões em aberto do plano (§12) estão listadas **uma vez**, por escrito. Nenhuma pergunta bloqueia a sprint: na ausência de resposta, aplica-se o default documentado e segue-se |
| R7 | A reformulação da linha SUS é mal interpretada como "abandono da proposta" | baixa | **alto** (reputação do TCC) | ADR 0003 registra o **porquê** com base técnica (credenciamento, ausência de sandbox). A linha reformulada continua sendo **o único ✔ da coluna** — a matriz não perde competitividade |
| R8 | A matriz de concorrência é reemitida e o orientador a rejeita | média | médio | Manter as **duas** colunas (visão × estado da v1). A versão de visão permanece intacta; a de estado é adicional, não substitutiva |

---

## R8 · RESPONSÁVEL

**Dono do projeto:** **Henrique Cordeiro** — nome único, sem ambiguidade. Dono de: escopo,
conteúdo de tela, redação do artigo, semeadura de dados de teste e conducto do estudo.

**Donos por etapa** (uma pessoa, prazos, sem órfãos):

| Etapa | Dono | Prazo | Validação |
|---|---|---|---|
| E1 Fundação visual | Henrique | 20/10 | — (autorrevisão: checklist de design system) |
| E2 Navegação e home | Henrique | 21/10 | Orientador (demo de 5 min) |
| E3 Formulários | Henrique | 23/10 | Orientador |
| E4 Assistente de tratamento | Henrique | 26/10 | — |
| E5 Profissional e relatório | Henrique | 28/10 | Orientador |
| E6 Resiliência e a11y | Henrique | 29/10 | Checklist de acessibilidade |
| E7 Buffer e entrega | Henrique | 30/10 | Orientador (demo final + entrega) |

**Validação dos responsáveis** (critério dos 8Rs):
- **Capacidade:** sim — é o autor do sistema, com histórico de implementação completo e domínio do
  domínio clínico e da stack.
- **Disponibilidade:** **é a restrição mais apertada do projeto.** 9 dias úteis para 7 etapas.
  Justificativa de por que a sprint é viável: as etapas tocam **apenas a camada de apresentação**,
  que consome use cases já prontos e testados.
- **Vontade:** o autor é o dono da proposta e do artigo — alinhamento máximo.

---

## PRÓXIMOS 3 PASSOS

1. **[hoje, 20/10]** Validar que o build de desenvolvimento Android sobe (`npx expo run:android`)
   e que `npm run lint && npm run format:check && npm test` estão verdes. **Se o build falhar,
   parar e re-planejar** — é o R1 e ele decide o modo de execução do estudo.
2. **[hoje, 20/10]** Ler o PMV e o reframe da matriz com o orientador e **registrar a decisão** em
   `docs/adr/0003-reposicionamento-da-integracao-sus.md` (status aceito) e em
   `docs/plano-geral-outubro-2026.md` §11.
3. **[21/10, manhã]** Implementar E2: tab bar + home do paciente com as 3 ações grandes, o
   `SegmentedControl` de período e os `StatTile`. Gravar um vídeo de 40 s do caminho
   "abrir → registrar crise → salvar" e **contar os toques** — é a métrica da SC-001.

---

## Registro de revisões

| Versão | Data | Mudança | Autor |
|---|---|---|---|
| v1.0 | 20/10/2026 | Criação a partir do diagnóstico da matriz × código | Henrique Cordeiro |
| | | | |
