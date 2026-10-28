# Plano Geral — MySeizures · rework de outubro de 2026

> **Documento-mestre.** Registra o que foi analisado, o diagnóstico, as decisões tomadas e o
> cronograma. É o ponto de partida para a sprint de 9 dias úteis (20 → 30/out/2026) e para a
> escrita do artigo do TCC.
>
> **Status:** vigente · **Elaborado em:** 20/10/2026 · **Dono:** Henrique Cordeiro

---

## 1. Contexto e pergunta que motivate o rework

O orientador concluiu que o projeto está "longe" da proposta inicial. A proposta se materializou
na **Matriz de Concorrência** (`docs/fix_pesquisa_TCC.pdf`), em que a coluna *Meu sistema* marca
13/13 funcionalidades como presentes. O código, na data de análise, entregava de forma completa
apenas 6 delas.

Ao longo do caminho chegou-se à conclusão de que a **integração direta com o Ecossistema SUS é
inviável** num TCC individual (credenciamento de estabelecimento, convênio municipal, ausência de
sandbox público). Essa linha da matriz foi **reformulada** pelo autor, com o aval do orientador,
para algo equivalente a *compatibilidade estrutural com e-SUS/RNDS — export versionado, sem
transmissão*.

**Pergunta que este plano responde:** é possível refatorar o projeto para adequá-lo à proposta?
**Resposta:** sim — e o gargalo não é a arquitetura, é o **escopo declarado** e a **camada de
apresentação**.

---

## 2. Insumos analisados

| Arquivo | Natureza | Uso neste plano |
|---|---|---|
| `mobile/`, `api/`, `specs/001-manage-epilepsy-care/` | Código e especificação existentes | Diagnóstico de lacunas (§3) |
| `docs/fix_pesquisa_TCC.pdf` | Matriz de Concorrência (1 pág., 13 linhas × 5 sistemas) | Fonte de verdade do escopo prometido |
| `docs/Fluxo - outro app epilepsia/` | 31 screenshots do app "Help epilepsy" (Material 3) | Referência visual de padrões (§5) |
| `docs/instructions/PROMPT.txt` | Skill dos 4 Is | Protocolo de conversa (§7) |
| `docs/instructions/8Rs.txt` | Skill 8Rs / PMV + PGG | Formato do plano e priorização (§4) |
| `docs/instructions/Expert de Desenvolvimento.pdf` | Pipeline de elicitação → UML → spec | Convenções de especificação (§7) |
| `docs/EBook - Experiencia_do_Usuario_em_Interfaces_Digitais.pdf` | André Grilo, EDUFRN/UFRN, 191 pág. | Fundamentação teórica de UX (§6) |

> `docs/current-overview.md` foi **desconsiderado** por estar desatualizado, conforme instrução do
> autor.

---

## 3. Diagnóstico: a Matriz × o código

| # | Funcionalidade da matriz | Epsy | Seizure Tracker | Epilepsy Journal | Epistemic | **Meu sistema (matriz)** | **Real em 20/10/2026** | Diagnóstico |
|---|---|---|---|---|---|---|---|---|
| 1 | Registro de crises | ✔ | ✔ | ✔ | ✔ | ✔ | `SeizureRecord`, `RecordSeizure`, `seizure_records`, tela `seizures/new.js` | ✅ Completo |
| 2 | Registro de auras | ✔ | ❌ | ❌ | ❌ | ✔ | **zero ocorrências de "aura" em todo o repositório** | ❌ Ausente |
| 3 | Registro de gatilhos | ✔ | ✔ | ✔ | ✔ | ✔ | `TriggerRecord` (causa, sono, humor, descrição) | ✅ Completo |
| 4 | Registro de tratamentos (meds, procedimentos) | ✔ | ❌ | ✔ | ✔ | ✔ | `TreatmentType` = `MEDICATION/THERAPY/OTHER`; "procedimento" não é conceito de 1ª classe | ⚠️ Parcial |
| 5 | Lembretes de medicação | ✔ | ❌ | ✔ | ✔ | ✔ | Notificações existem, mas **IDs de notificação não são persistidos** → órfãs ao editar tratamento | ⚠️ Completo com defeito |
| 6 | Aderência a medicamento | ❌ | ✔ | ❌ | ❌ | ✔ | `TAKEN`/`MISSED`, estado final único, `aggregateAdherence` | ✅ Completo |
| 7 | Monitoramento contínuo | ❌ | ✔ | ❌ | ✔ | ✔ | Apenas 2 regras estáticas (`≥3 crises`, `adesão<80%`). **Não há** correlação gatilho→crise nem agregação de sono/humor/rutina | ❌ Fino demais |
| 8 | Calendário | ✔ | ✔ | ✔ | ✔ | ✔ | `ListChronologicalEvents` emite só `SEIZURE`/`TRIGGER` (FR-006 parcial) | ⚠️ Parcial |
| 9 | Geração de relatórios | ❌ | ✔ | ✔ | ✔ | ✔ | Semanal/mensal/anual + tendências + adesão + alertas | ✅ Completo |
| 10 | Rede de apoio | ❌ | ❌ | ❌ | ❌ | ✔ | Grant/revoke + relatório profissional existem; profissional **digita ID numérico**; home profissional é tela morta; falta descrição de crises e pessoa de contato | ⚠️ ~60% |
| 11 | Alertas clínicos | ❌ | ❌ | ❌ | ❌ | ✔ | `prototype-1.0` = 2 regras puras e versionadas | ⚠️ Escopo mínimo |
| 12 | **Interface de baixo esforço** | ❌ | ❌ | ✔ | ❌ | ✔ | **Sem design system, sem tab bar, sem captura rápida, timestamp manual, horários de tratamento em texto separado por vírgula, sem `Undo`, sem rascunho** | ❌ O buraco real |
| 13 | Integração Ecossistema SUS | ❌ | ❌ | ❌ | ❌ | ✔ | `RndsExportMapper` v1.0 com allow-list + `ReportFileExporter` local, **sem transmissão** (ADR 0002). É *compatibilidade estrutural*, não integração | ⚠️ Já reformulada |

**Placar:** 6 completas · 5 parciais · 2 ausentes · 1 reformulada.

### 3.1 O que **não** precisa ser refeito

A arquitetura é o ativo mais maduro do projeto e deve ser preservada:

- **Clean Architecture com Ports & Adapters.** `mobile/src/domain/` não importa React Native, SQLite
  ou Express. `mobile/src/composition/container.js` é o único ponto que monta adapters concretos.
- **Isolamento por paciente imposto em runtime.** `PatientScopedRepository` **rejeita** qualquer SQL
  sem a coluna `patient_id` **e** o bind `$patientId` — privacy por construção, não por convenção.
- **Autorização antes de leitura clínica.** `GenerateReport.requireAccess()` roda antes de
  qualquer consulta ao repositório.
- **Regras de domínio puras, versionadas e testadas.** `prototype-1.0` com testes de fronteira.
- **Export com allow-list e versão de contrato.** Zero vazamento de credenciais.
- **41 suítes / ~5.400 linhas de teste.** `lint`, `format:check` e `npm test` verdes.

**Consequência prática:** as telas novas **não precisam de backend novo** — só de chamar use cases
que já existem. É por isso que 9 dias de apresentação são factíveis, e 9 dias de domínio novo não
seriam.

---

## 4. A virada de chave: o caminho crítico são os testes de usabilidade

Os critérios de sucesso da spec **já são métricas de teste de usabilidade**:

| Spec | Critério | É literalmente… |
|---|---|---|
| SC-001 | 90% registram crise com todos os detalhes em **< 60 s** | Tarefa 1 do teste |
| SC-002 | 90% criam tratamento + confirmam dose em **< 2 min** | Tarefa 2 |
| SC-003 | Profissional encontra alertas + adesão em **< 1 min** | Tarefa 3 |
| SC-004 | 100% negação após revogação; 100% export correto | Tarefas 4/5 |
| SC-005 | 100% das entradas offline sobrevivem à reabertura | Tarefa 5 |

`traceability.md` marca SC-001/002/003 como **NOT MEASURED**. `validation.md` tem **7 itens manuais
pendentes**. Ou seja: **os testes de usabilidade de novembro não são um extra — são a seção
"Resultados" do artigo.**

| Fluxo | Estado em 20/10 | Risco na SC |
|---|---|---|
| SC-001 registrar crise | timestamp ISO manual, tipo em campo de texto | 🔴 **falha certa** — digitar ISO 8601 em 60 s é inviável |
| SC-002 tratamento + dose | horários em texto separado por vírgula (`baseTimes.join(', ')`) | 🔴 **falha certa** — ninguém entende nem erra o formato |
| SC-003 relatório profissional | profissional **digita um ID numérico**; home é tela morta | 🔴 **falha certa** — ninguém adivinha "digite 1" |
| SC-005 offline | sessão revalida token na API após restart | 🟡 risco |

**Conclusão de planejamento:** nos 9 dias disponíveis, o que cabe e o que **precisa** caber é:
**os 3 fluxos medidos ficam rápidos e claros, com uma linguagem visual consistente.** Auras e
monitoramento contínuo entram como *trabalhos futuros* declarados no artigo.

### 4.1 PGG Dominó (regra dos 8Rs aplicada à priorização)

> *Qual, se feito primeiro, deixa os demais mais fáceis ou desnecessários?*

**O design system + a home/quick-log.** Sem ele, nenhuma tela nova nasce consistente e o teste de
usabilidade mede uma colcha de retalhos. Ele é o desbloqueador de tudo.

---

## 5. Padrões extraídos do app de referência (31 telas)

| # | Padrão observado | Aplicação no MySeizures |
|---|---|---|
| 1 | Bottom nav com 4 abas | `Tabs` do Expo Router: **Início · Registros · Tratamentos · Compartilhar** |
| 2 | Segmented control Week/Month/Year | `SegmentedControl` reutilizável (hoje o `SelectField` se repete em 3 telas) |
| 3 | FAB "+" + ação primária no cabeçalho | 1 ponto de entrada por domínio |
| 4 | Bottom sheet "Select one option(s)" com radio/checkbox, X, ação primária, campo "Other" | `SelectSheet` — resolve "causa = OTHER exige descrição" sem poluir o form |
| 5 | Wizard de 3 passos com stepper e Previous/Next | **Mata o `baseTimes.join(', ')`**; passo 1 = motivo + tipo (meds/procedimentos) |
| 6 | Escolhas como botões outline grandes (não dropdown) | `ChoiceGroup` — 2 toques em vez de abrir menu |
| 7 | Auras = "Felt it coming?" (bool) na crise + gráfico "% de crises com aura" | **Muda o plano de auras** para ~1 dia (ver §8) |
| 8 | "My seizures description" + "Add a contact person" | Peça que falta na "Rede de apoio" |
| 9 | Emoji como eixo Y (😊100% / 😐50% / 😞0%) | Status **sem depender de cor** |
| 10 | Nota de rodapé explicando cada métrica | "A adesão é calculada sobre doses com confirmação final" |
| 11 | Disclaimer fixo: "These graphs are no substitution for normal care…" | Replicar na tela de relatório |
| 12 | Microcopy empática: *"Good recovery! Detail this seizure as well as possible. It could help yourself and your medical team."* | Tom de voz: acolhimento + **explicar o porquê** do pedido |

---

## 6. Fundamentação teórica disponível (citável no artigo)

Extraída do eBook (Grilo, EDUFRN/UFRN):

| Conceito | Local | Aplicação |
|---|---|---|
| **ISO 9241-11** — usabilidade = eficiente, eficaz, satisfatório | cap. 2.1 | Definição operacional das SC-001/002/003 |
| **ISO 9241-210** — UX ≠ usabilidade | cap. 2.1 | Sustenta "app usável" ≠ "experiência proposta" |
| **Shneiderman (1986)** — 8 regras de ouro | Quadro 2.1 | Consistência, atalhos, feedback, prevenção de erros, **reversão**, controle do usuário, **baixa carga de memorização** |
| **Nielsen (1995)** — 10 heurísticas | Quadro 2.1 | Visibilidade do status, reconhecer ≠ lembrar, flexibilidade, estética minimalista |
| **Affordance real × percebido** (Gibson 1979 / Norman 1988) | cap. 3, p. 75-77 | **Chave do design system**: componente que não parece clicável não é clicável |
| **Carga cognitiva** (Cybis, Betiol & Faust, 2015) | cap. 3, p. 85 | Justifica o registro em 1 toque: não pedir mais do que o necessário |
| **Acessibilidade (W3C)** | cap. 2.2, p. 54-55 | Sustenta a constituição e o teste com leitor de tela |
| **Cognição** — atenção, memória, linguagem, modelos mentais | cap. 3.2 | Explica por que timestamp manual e lista de 12 gatilhos matam o usuário |
| **Linguagem e Comunicação / tom de voz** | cap. 4 | Sustenta o tom empático das microcopies |

**R3 Referência (PEGE):** Princípios = ISO 9241-11/210, Nielsen 1995, Shneiderman 1986, Norman,
Grilo 2018 · Exemplos = Seizure Tracker, Epilepsy Journal, Epsy, Epistemic + o app de referência ·
Guias = o eBook · Experts = Don Norman (NN/g), Jakob Nielsen.

> ⚠️ *Referência inventada é pior que nenhuma.* Só citar o que existe de fato.

---

## 7. Protocolo de trabalho adotado (dos `instructions/`)

- **4 Is** (`PROMPT.txt`) — toda resposta minha traz **Intenção** (por quê, antes da tarefa),
  **Instrução** (verbo + escopo), **Informação** (contexto que só o autor tem) e **Interação**
  (convite a iterar; a 1ª resposta é rascunho). Pedido vago → uma linha de diagnóstico + pedido
  reescrito + sigo com a tarefa, sem aula.
- **8Rs / PMV** (`8Rs.txt`) — o plano do sprint é um PMV no template exato
  (`docs/pmv-outubro-2026.md`), com `[a definir]` onde faltar, e ordem definida pelo **PGG Dominó**.
- **Expert de Desenvolvimento** — artefatos com `RF-XXX`/`RNF-XXX`/`RN-XXX`, critérios
  **Given-When-Then**, PlantUML, **no máximo 5 perguntas por vez**, `SUPOSIÇÃO` marcado,
  versionamento v1/v2/v3, e o template de prompt por módulo.

Convenções detalhadas: `docs/practices/working-with-the-agent.md`,
`docs/practices/planning-and-scoping.md`, `docs/practices/spec-conventions.md`.

---

## 8. Escopo da sprint: dentro e fora

### Dentro (entregável em 30/out)

1. **Design system** tokenizado (paleta atual mantida) + primitivas de UI.
2. **Tab bar** com 4 abas + **home** redesenhada (FAB + 3 ações grandes + gráfico da semana).
3. **Form de crise**: timestamp = agora, tipo em `ChoiceGroup`, `feltAura`, salvar em 1 toque.
4. **Form de gatilho**: causa em `SelectSheet` multi-seleção, sono/humor em rating, "Other" condicional.
5. **Wizard de tratamento em 3 passos** + dose em 1 toque na home.
6. **Home do profissional** com lista de pacientes autorizados (sem digitar ID).
7. **Relatório** unificado com export, estados denied/empty, disclaimer, notas de rodapé.
8. **Offline real** (self-access sem API) + rascunho + `Undo` curto.
9. **Métrica de auras** no relatório (`%` de crises com aura).
10. **Acessibilidade**: alvos 48dp, `liveRegion`, contraste.
11. **"Minha descrição de crises" + pessoa de contato** (rede de apoio).
12. **Evidências** (prints/vídeos dos 3 fluxos) + **protocolo de usabilidade e TCLE**.

### Fora (vira "trabalhos futuros" no artigo)

- Registro de auras como entidade independente (aura avulsa sem crise subsequente).
- Indicadores de monitoramento contínuo (correlação gatilho→crise, agregados de sono/mood/rutina).
- Escopo de grant (`FULL` / `ADHERENCE_ONLY`) e diretório de profissionais.
- Feed cronológico unificado (FR-006 completo: reminder e adesão no histórico).
- Diário diário de sono/humor (entidade nova).
- Integração direta com RNDS/e-SUS (inviável — ver §1).

### Reenquadramento da matriz (para o artigo e a defesa)

A matriz passa a ser apresentada em **dois níveis**, o que é mais forte que uma matriz de 13/✔ que o
código não cumpre:

- **Nível 1 — Visão do produto (13/13):** o que a proposta ambiciona.
- **Nível 2 — Estado da v1 (out/2026):** marcação honesta em 3 níveis
  (`✔ implementado` / `◐ parcial` / `✔ estrutural`).

---

## 9. Cronograma — 9 dias úteis (20 → 30/out/2026)

| # | Dia | Entrega | Padrão aplicado |
|---|---|---|---|
| **D1** | ter 20/10 | **Documentação** (§10) + `theme/tokens.js` + primitivas de UI | Base do design system |
| **D2** | qua 21/10 | **Tab bar** + **home do paciente** (FAB + 3 ações + gráfico semanal) | 1, 2, 3, 9, 10 |
| **D3** | qui 22/10 | **Form de crise** (timestamp = agora, `ChoiceGroup`, `feltAura`, 1 toque) | 4, 6, 12 |
| **D4** | sex 23/10 | **Form de gatilho** (`SelectSheet` multi, rating sono/humor, "Other") | 4, 6 |
| **D5** | seg 26/10 | **Wizard de tratamento 3 passos** + **dose em 1 toque** na home | 5 |
| **D6** | ter 27/10 | **Home do profissional** com lista de pacientes autorizados | SC-003 |
| **D7** | qua 28/10 | **Relatório** unificado com export + disclaimer + notas de rodapé | 10, 11 |
| **D8** | qui 29/10 | **Offline real** + rascunho + `Undo` + **métrica de auras** | Shneiderman: reversão |
| **D9** | sex 30/10 | **Acessibilidade** + **"descrição de crises" e contato** + **buffer**: lint/format/test, build de dev, **evidências**, **protocolo de usabilidade + TCLE** | 8 |

**Contingências (ordem de sacrifício):**
1. Tela de verificação do arquivo exportado
2. `Undo` / rascunho
3. "Descrição de crises" e contato
4. Métrica de auras
5. ~~Diário~~ (nunca coube)

**Riscos e mitigantes (R7):**

| Risco | Prob. | Impacto | Mitigante |
|---|---|---|---|
| Build Android não sobe | média | alto | Validar `npx expo run:android` já no D1; nunca depender de build novo no fim |
| Suíte de apresentação quebra com a reescrita das telas | alta | médio | 2 h reservadas no D9; testes de apresentação reescritos junto da tela |
| Rotação de dependências Expo/RN | média | alto | **Não atualizar dependências** (precedente: commit `f496efd`, `react-native-screens` × Codegen) |
| Usuário do teste não entende o fluxo | média | alto | O roteiro do teste **é** a métrica: o teste avalia o produto, não só oSucesso |
| Escopo cresce | alta | médio | Regra do incremento demonstrável: todo dia termina com o app rodando |

---

## 10. Artefatos criados nesta rodada

**Documentos (este diretório `docs/`)**

| Arquivo | Conteúdo |
|---|---|
| `docs/plano-geral-outubro-2026.md` | Este documento-mestre |
| `docs/visual-design-system.md` | Tokens, primitivas, padrões de tela, tom de voz, acessibilidade |
| `docs/ui-patterns-and-screens.md` | Inventário de telas, wireframes ASCII, 3 fluxos dourados, matriz de estados |
| `docs/reference-app-analysis.md` | Os 12 padrões das 31 telas: o que copiamos, o que não, e por quê |
| `docs/usability-study-protocol.md` | Roteiro das tarefas medidas, TCLE, métricas, como reportar |
| `docs/pmv-outubro-2026.md` | PMV (8 Rs) do sprint, no template dos 8Rs |
| `docs/practices/working-with-the-agent.md` | 4 Is, briefing, revisão por evidência, registro de decisão |
| `docs/practices/planning-and-scoping.md` | PMV, PGG Dominó, rubrica de prioridade, incremento demonstrável, DoD |
| `docs/practices/decision-records.md` | Template de ADR + índice vivo (0001, 0002, 0003) |
| `docs/practices/spec-conventions.md` | Convenções RF/RNF/RN, GWT, PlantUML, 5 perguntas, SUPOSIÇÃO, versionamento |
| `docs/adr/0003-reposicionamento-da-integracao-sus.md` | ADR novo: escopo de interoperabilidade SUS da v1 |

**Código (D1)**

| Caminho | Conteúdo |
|---|---|
| `mobile/src/presentation/theme/tokens.js` | Tokens de cor, espaçamento, raio, tipografia, alvo de toque |
| `mobile/src/presentation/components/ui/*.js` | `Screen`, `Card`, `Button`, `Chip`, `SegmentedControl`, `ChoiceGroup`, `SelectSheet`, `StatTile`, `EmptyState`, `Field` |
| `mobile/src/presentation/components/ui/index.js` | Barrel de exportação |
| `mobile/tests/unit/presentation/uiPrimitives.test.js` | Cobertura de acessibilidade e comportamento das primitivas |

### 10.1 Estado verificado ao final do D1 (20/10/2026)

| Verificação | Resultado |
|---|---|
| `npm run lint` | ✅ 0 erros |
| `npm run format:check` | ✅ todos os arquivos conformes |
| `npm test` | ✅ **38 suítes / 241 testes, 0 falhas** |

**Duas falhas pré-existentes foram encontradas e corrigidas.** Elas já falhavam no código original
(confirmado com `git stash` sobre `HEAD`), e foram introduzidas por commits posteriores à evidência
de validação de 01/09/2026:

| Falha | Causa raiz | Correção |
|---|---|---|
| `privacyAccess.test.js` — *"Authentication adapter returned a token without a valid expiration"* | O commit `74b3035` passou a exigir um token em formato JWT (com `exp`) e a gravar um **envelope** `{token, tokenExpiresAt, user}` no SecureStore. O teste ainda usava um token opaco e afirmava *"persists only the token"* | O duplo de teste passou a produzir um token JWT real; as asserções foram atualizadas para o contrato vigente (token + expiração + identidade mínima, **sem credencial**). O `docs/architecture.md` (linhas 57 e 69) foi corrigido, porque ainda afirmava *"Only the token is persisted"* |
| `us1-offline-flow.test.js` — *"Unable to find an element with accessibility label: Seizure date and time"* | O commit `ae293e1` substituiu o campo de texto ISO por seletores nativos; o teste ainda fazia `fireEvent.changeText` | As telas passaram a aceitar `initialOccurredAt` / `initialRecordedAt` — o mesmo padrão já usado por `CalendarScreen` (`initialPeriod`) — e o teste passou a controlar o instante pela prop |

**Um defeito real foi encontrado e corrigido durante o D1:** o `SelectSheet` sincronizava estado a
partir de props dentro de um `useEffect` sem guarda de igualdade. Com um array inline
(`values={[...]}`), a referência nova a cada render realimentava o efeito indefinidamente —
**loop infinito de render**. Isso quebraria o app em produção, não apenas o teste. Corrigido com
atualização funcional que devolve o estado anterior quando o conteúdo é equivalente.

**Lição registrada:** a suíte de validação de 01/09 está **obsoleta** em relação ao código atual.
`docs/validation.md` e `docs/traceability.md` precisam ser reexecutados no fim da sprint, e não
devem ser citados como evidência do estado atual antes disso.

### 10.2 Mudanças fora do escopo estrito do D1 (registradas para revisão)

| Arquivo | Mudança | Motivo |
|---|---|---|
| `mobile/app/(patient)/index.js` | Bloco `catch` vazio recebeu comentário explicativo | **Erro de lint pré-existente** (regressão do commit `40c2cd9`, posterior à validação de 01/09). Bloqueava `npm run lint` verde |
| `mobile/app/(patient)/seizures/new.js`, `triggers/new.js` | Novas props `initialOccurredAt` / `initialRecordedAt` | Necessárias para corrigir a falha de integração acima |
| `docs/architecture.md` | Contrato de sessão corrigido | O documento contradizia o código desde `74b3035` |
| `README.md` | Índice de documentação reorganizado | Os 11 documentos novos estavam invisíveis |
| `.specify/memory/constitution.md` | v1.0.0 → v1.1.0, novo Princípio VI | Formaliza o "privilégio de usabilidade" e a exigência de honestidade das afirmações públicas |

---

## 11. Decisões tomadas (registro)

| # | Decisão | Justificativa | Data |
|---|---|---|---|
| D-01 | Manter a paleta azul-marinho atual | Zero churn visual, zero quebra de teste; o problema era a ausência de tokens, não a cor | 20/10/2026 |
| D-02 | Semana 1 começa pelos documentos | O design system precisa estar escrito antes das telas; o PMV vira o `plan.md` da feature 002 | 20/10/2026 |
| D-03 | Prioridade = SC-001/002/003 > diferenciação da matriz | O teste de usabilidade de novembro é a seção "Resultados" do artigo | 20/10/2026 |
| D-04 | Auras como `feltAura` booleano na crise, não entidade nova | 1 dia em vez de 3; é o que o app de referência faz; cumpre a linha da matriz | 20/10/2026 |
| D-05 | Sem "comandos de voz" no escopo | Reconhecimento de fala no RN exigiria módulo nativo de terceiros; risco alto, ganho baixo num TCC de 9 dias | 20/10/2026 |
| D-06 | Não atualizar dependências Expo/RN | Precedente de quebra por Codegen; o gain de versão é nulo em 9 dias | 20/10/2026 |
| D-07 | Matriz apresentada em dois níveis (visão × estado v1) | Honestidade que fortalece a defesa em vez de expor a distância | 20/10/2026 |
| D-08 | Corrigir as duas falhas de teste pré-existentes e o `architecture.md` divergente | A suíte de validação de 01/09 está obsoleta em relação ao código; um repositório com teste vermelho não sustenta a seção de resultados do artigo | 20/10/2026 |
| D-09 | Telas de registro aceitam `initialOccurredAt` / `initialRecordedAt` | Mesmo padrão já usado por `CalendarScreen` (`initialPeriod`); permite testar o fluxo real sem simular digitação de ISO 8601 | 20/10/2026 |
| D-10 | A interface permanece em inglês nesta sprint | Todo o app, os rótulos de acessibilidade e a suíte já estão em inglês; traduzir no meio da sprint quebraria as asserções. **A passagem para PT-BR é uma decisão de produto consciente, não um efeito colateral** — e é relevante, dado o público-alvo | 21/10/2026 |
| D-11 | Ícones de tab como glifos de texto, sem `@expo/vector-icons` | O pacote não está instalado; evitar dependência nova respeita D-06. Se a barra for reaproveitada, virou primitiva em `ui/` | 21/10/2026 |
| D-12 | N4 automatizado via `adb` a partir do WSL | O `adb.exe` do SDK Android do Windows roda dentro do WSL: o agente passa a instalar, abrir, capturar tela e **ler a imagem**. O N4 deixa de ser tarefa do autor | 21/10/2026 |

---

## 13. Protocolo de verificação diária

Cada dia útil da sprint termina com uma verificação em níveis. O painel está em
[`docs/sprint-outubro/INDICE.md`](sprint-outubro/INDICE.md).

| Nível | O que prova | Comando | Quem |
|---|---|---|---|
| **N0** | O app **empacota** | `npx expo export --platform android` | 🤖 |
| **N1** | A suíte está verde | `npm test` | 🤖 |
| **N2** | Lint e formatação | `npm run lint` && `npm run format:check` | 🤖 |
| **N3** | A feature do dia **funciona** (teste novo, não só "não quebrou") | incluído no N1 | 🤖 |
| **N4** | O app **funciona no aparelho** | `adb install` → `am start` → `screencap` → **leitura da imagem** | 🤖 |
| **N5** | O app **funciona na web** | `expo export --platform web` + servidor estático | 🤖 |
| **N6** | Acessibilidade e usabilidade **reais** | Fonte dinâmica e toque; TalkBack já validado no D2 (não repetir) | 👤 autor |

**Regra do dia:** N0–N3 são obrigatórios para declarar o dia encerrado. N4 e N5 são o **incremento
demonstrável** — o dia só conta como entregue quando o app abre e mostra a mudança. N6 é pontual,
não diário. O TalkBack foi validado uma vez no D2 (26/10) e não entra no checklist recorrente.

**Como o N4 é executado (D-12):** o `adb.exe` do SDK Android instalado no Windows roda dentro do
WSL. O agente pode, portanto: compilar (via `cmd.exe`, usando o Node do Windows e o JBR do
Android Studio como `JAVA_HOME`, porque o `java` do PATH é o Java 8, incompatível com o Gradle
atual), instalar, abrir, enviar toques, capturar a tela e **ler a captura** para verificar
visualmente. O autor só precisa conectar o celular por USB com a depuração USB ativa.

**Onde o N0 ajuda:** é a verificação mais barata que prova que **todos os imports resolvem e a
aplicação inteira compila**. Como o ambiente não tem `adb` no PATH nem emulador, era o único
"o app está vivo" disponível antes do N4 — e por isso foi executado no D1 e no D2.

---

## 14. Plano de commits

> **O autor faz o commit manualmente.** O agente **não** commita nem faz push: não há
> `credential.helper` configurado, e publicar é ato de autoria. A lista de arquivos prontos é
> mantida em [`docs/sprint-outubro/INDICE.md`](sprint-outubro/INDICE.md) §4.

**Unidades de commit planejadas** (mensagens no padrão já usado pelo repositório):

| # | Mensagem | Conteúdo |
|---|---|---|
| 1 | `docs: add the design system, interface patterns, and reference analysis` | `docs/visual-design-system.md`, `docs/ui-patterns-and-screens.md`, `docs/reference-app-analysis.md` |
| 2 | `docs: add the sprint plan, the minimum viable plan, and the usability study protocol` | `docs/plano-geral-outubro-2026.md`, `docs/pmv-outubro-2026.md`, `docs/usability-study-protocol.md` |
| 3 | `docs(practices): add the working, planning, decision-record, and specification conventions` | `docs/practices/` |
| 4 | `docs(constitution): v1.1.0 — add the usability privilege and honest public claims principle` | `.specify/memory/constitution.md` |
| 5 | `feat(mobile): add design tokens and shared UI primitives` | `theme/`, `components/ui/`, barrel, 17 testes |
| 6 | `fix(mobile): align the session contract and the entry forms with the current behaviour` | `privacyAccess`, `us1-offline-flow`, telas de registro, `architecture.md`, `catch` do lint |
| 7 | `docs(adr): record the repositioning of the SUS interoperability scope` | `docs/adr/0003-*.md` + índice |
| 8 | `feat(mobile): add the patient tab bar and redesign the home screen` | `(tabs)/*`, `_layout.js`, imports de teste, 8 testes novos |
| 9 | `docs(sprint): add the daily verification records and the sprint dashboard` | `docs/sprint-outubro/` |

**Regras**
- Nenhum commit mistura a **Bloco A** (modificações do autor em `.specify/*.json` e `prompts/*.md`),
  que fica no working tree até decisão do autor.
- Nenhum commit inclui o material de referência local (eBook e capturas do app de referência).
- Todo commit é verde em N1 e N2 no momento em que é criado.

---

## 15. Pendências para o autor

1. **Prazo de novembro:** quantos participantes de teste é possível recrutar, e de que perfil
   (paciente / cuidador / médico)? Define o N e o poder estatístico do resultado.
2. **Aparelho Android:** conectar por USB com a depuração USB ativa, para o N4 virar
   automatizado. Sem isso, o N4 volta a ser uma verificação manual.
3. **Termo de consentimento:** há modelo institucional da universidade disponível, ou redigimos
   um genérico para revisão do comitê de ética?
4. **Contato com o orientador:** apresentar o PMV e o reframe da matriz antes ou depois de D3?
   Recomendo **antes**, com o PMV em mãos.
5. **Artigo:** há formato/estilo definido (ABNT? template da banca?) e quantas páginas?
6. **Idioma da interface:** manter inglês nesta sprint (D-10) ou preparar PT-BR? Decisão de produto
   — relevante para o público-alvo e para a defesa.

