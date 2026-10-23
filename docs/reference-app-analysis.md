# Análise do App de Referência — "Help epilepsy"

> Análise das 31 telas em `docs/Fluxo - outro app epilepsia/` (capturas de 15/10/2026, 1080×2408),
> usadas como referência visual para o rework de interface do MySeizures.
>
> **Status:** v1.0 · **Data:** 20/10/2026 · **Finalidade:** registrar o que foi **adotado**, o que
> foi **adaptado** e o que foi **descartado**, com justificativa.

> ⚠️ **As capturas são material local e não versionado** (ver `.gitignore`): são a interface de um
> produto comercial de terceiro. Este documento registra os **padrões de interação** observados —
> não reproduz imagens, telas, textos nem ativos do app original.

---

## 1. Identificação do app

Material Design 3, paleta roxa com gradiente lilás, bottom navigation de 4 abas, idioma
inglês (com alguns termos em português no aparelho do autor). O app é uma referência de **padrões
de interface**, não de domínio: cobre diário, crises, gatilhos, auras, tratamento e adesão.

> ⚠️ **Cuidado de escopo.** Este app é um produto comercial maduro (busca de medicamentos em
> base real, upload de vídeo, lembretes destoppable, múltiplos gráficos). O MySeizures é um
> protótipo acadêmico com 9 dias úteis. Adotar *padrões* é legítimo e barato; Adoptar *funcionalidade*
> seria voltar ao escopo impossível. A tabela da §4 separa as duas coisas.

---

## 2. Inventário das telas capturadas

| # | Arquivo (prefixo) | Tela |
|---|---|---|
| 1 | `214636` | Home — semana, sem dados |
| 2 | `214651` | Home — mês, gráfico de barras |
| 3 | `214700` | Home — ano |
| 4 | `214716` | More graphs — lista de gráficos (fechado) |
| 5 | `214739` | Add Seizure — campos obrigatórios + "Felt it coming?" |
| 6 | `214752` | Add Seizure — campos opcionais (vídeo, sono, duração, gatilhos) |
| 7 | `214801` | Add Seizure — opcionais (reações pós-crise, medicação de emergência) |
| 8 | `214837` | Add Seizure — opcionais (local, observações) |
| 9 | `214936` | Bottom sheet — seleção de **tipo** de crise (única) |
| 10 | `215009` | Bottom sheet — seleção de **gatilhos** (múltipla) |
| 11 | `215033` | Bottom sheet — **reações pós-crise** (múltipla) |
| 12 | `215046` | Bottom sheet — **medicação de emergência** (múltipla) |
| 13 | `215201` | More graphs — adesão expandida, com emoji no eixo Y |
| 14 | `215219` | More graphs — auras expandida ("0.0% das suas crises") |
| 15 | `215237` | More graphs — sono expandido (vazio) |
| 16 | `215242` | More graphs — humor expandido (vazio) |
| 17 | `215300` | Diary — semana + entradas Mood/Sleep por dia |
| 18 | `215440` | Treatment — passo 1, motivo do tratamento |
| 19 | `215450` | Treatment — passo 1, tipo de tratamento |
| 20 | `215459` | Treatment — busca do nome do medicamento (autocomplete) |
| 21 | `215542` | Treatment — passo 2, frequência semanal/diária |
| 22 | `215555` | Treatment — passo 2, quantas vezes ao dia |
| 23 | `215837` | Treatment — passo 2, horários + dose + total diário |
| 24 | `215905` | Treatment — passo 3, data de início |
| 25 | `215930` | Treatment — passo 3, data de término |
| 26 | `215944` | Treatment — revisão (parte 1) |
| 27 | `220006` | Treatment — revisão (parte 2) + Confirm |
| 28 | `220022` | Treatments — lista com segment Current/Past&Future |
| 29 | `220029` | My seizures description — texto livre + contato |
| 30 | `220045` | (tela intermediária de revis��o) |
| 31 | `220210` | Add Seizure — seleção de "Where it happened" |

---

## 3. Os 12 padrões observados

### P1 — Bottom navigation com 4 abas
`Home · Diary · Treatments · Settings`, ícone + rótulo, estado selecionado em cor primária.
**Adotado:** `Tabs` do Expo Router — `Início · Registros · Tratamentos · Compartilhar`.
O MySeizures já tem "Compartilhar"; o app de referência não tem rede de apoio, o que é a
diferenciação do MySeizures.

### P2 — Segmented control para período
Pílula com fundo lilás e seleção em branco, com rótulos Week/Month/Year.
**Adotado:** `SegmentedControl`. Elimina a repetição do `SelectField` em 3 telas e deixa a escolha
de período visível (não escondida em dropdown).

### P3 — Uma ação primária por contexto
"Add Seizure" no cabeçalho + FAB "+" em Diary/Treatments.
**Adotado:** 3 ações grandes na home (não um FAB solto) + FAB nas telas de lista.
**Descartado:** FAB flutuante sobrepondo conteúdo no scroll — a home do MySeizures é curta e a
grade de cartões já funciona como entrada.

### P4 — Bottom sheet para listas de escolha
Modal com título "Select one option(s)", opções com radio/checkbox, X para fechar, botão primário
("Add"/"Validate") e campo "Other option?" que **só aparece** quando a opção `OTHER` está
selecionada.
**Adotado:** `SelectSheet`. É a solução direta para a regra de domínio "causa `OTHER` exige
descrição" (`clinicalRecords.js:43-46`), hoje resolvida com validação inline que só aparece
depois do erro.

### P5 — Assistente de 3 passos com stepper
`Info → Frequency → Period`, com Previous/Next no rodapé e o estado das etapas visível no topo.
**Adotado integralmente** no tratamento. Resolve três problemas de uma vez:
- o defeito do `baseTimes.join(', ')` (`treatments/new.js:18`);
- a linha "Registro de tratamentos (**meds, procedimentos**)" da matriz, porque o passo 1 separa
  *motivo* e *tipo*;
- a carga cognitiva, distribuindo um formulário longo em três decisões pequenas.

### P6 — Escolhas como botões grandes, não dropdown
"Yes / No, for another reason", "Once / Twice / 3x a day", "Today / Another day" em botões
outline de altura generosa.
**Adotado:** `ChoiceGroup`. Dois toques em vez de abrir um menu.

### P7 — Auras como "Felt it coming?" + métrica percentual
O campo "Felt it coming? (Sim/Não)" aparece **no registro da crise**, e o gráfico de auras mostra
*"You reported auras in 0.0% of your seizures"*.
**Adotado com uma simplification deliberada:** o MySeizures implementa `feltAura` (booleano) +
descrição opcional **na crise**, e publica a métrica "X% das convulsões tiveram aura" no relatório.
**Descartado:** entidade `AuraRecord` independente — seria 2–3 dias e não cabe em 9.
**Impacto na matriz:** cumpre a linha "Registro de auras" com ~1 dia em vez de 3.

### P8 — "My seizures description" + "Add a contact person"
Quatro campos de texto livre (descrição das minhas crises, como eu as vivencio, como os outros
podem me ajudar) + uma pessoa de contato.
**Adotado (D9).** É a peça que dá substância à linha "Rede de apoio" da matriz, onde **todos os
concorrentes são ❌**. Custo baixo: 4 campos + 1 contato.

### P9 — Emoji como eixo Y nos gráficos
`100% 😊 / 50% 😐 / 0% 😞` no gráfico de adesão.
**Adotado como princípio, não como emoji:** o requisito real é **nunca comunicar status só por
cor** (P3 do design system). A regra do MySeizures já é mais forte — a barra de
`ReportSummaryChart` acompanha o valor numérico exato. O app de referência é a **evidência de que
essa decisão é necessary** e deve ser mantida.

### P10 — Nota explicativa em cada gráfico
*"The medication adherence is calculated based on the planned medication and the medication marked
as taken. 100% means that all medication was taken as planned."*
**Adotado.** O MySeizures já faz isso no `ClinicalAlertList` ("Regra prototype-1.0") e ganha a
mesma nota nas métricas de adesão e auras.

### P11 — Disclaimer fixo no rodapé
*"These graphs are no substitution for normal care or practice. Before any therapy change, always
discuss it with your doctor."*
**Adotado.** Replica o disclaimer que já existe no `ClinicalAlertList`, agora também na tela de
relatório do profissional.

### P12 — Microcopy empática que explica o porquê
*"Good recovery! Detail this seizure as well as possible. It could help yourself and your medical
team."*
**Adotado.** É a aplicação direta do cap. 4 do eBook (Linguagem e Comunicação) e vira regra na
§5 do `docs/visual-design-system.md`. Hoje o MySeizures diz apenas "Add the date, time, and type of
a seizure." — funcional, mas sem acolhimento e sem justificativa.

---

## 4. Adotado × adaptado × descartado

| Padrão | Decisão | Justificativa |
|---|---|---|
| Bottom nav (P1) | **Adotado** | Padrão de navegação dominante em Android; a home atual é uma lista de links |
| Segmented control (P2) | **Adotado** | Consistência + remove `SelectField` repetido |
| Ação primária por contexto (P3) | **Adaptado** | Grade de 3 ações na home; FAB apenas nas listas |
| Bottom sheet (P4) | **Adotado** | Resolve a regra de `OTHER` de forma elegante e testável |
| Assistente 3 passos (P5) | **Adotado integral** | Resolve 3 problemas de uma vez |
| Botões de escolha (P6) | **Adotado** | Reduz toques, conforme P1 (carga cognitiva) |
| Auras como bool na crise (P7) | **Adaptado** | Entidade nova não cabe no prazo |
| Descrição de crises + contato (P8) | **Adotado** | Baixo custo, alto valor de diferenciação |
| Emoji no eixo (P9) | **Adaptado a princípio** | Regra é "nunca só cor"; valores numéricos são melhores |
| Notas de rodapé (P10) | **Adotado** | Já partially presente; generalizar |
| Disclaimer (P11) | **Adotado** | Já presente no `ClinicalAlertList` |
| Microcopy empática (P12) | **Adotado** | Alto impacto na percepção de esforço |
| Base de medicamentos com autocomplete | **Descartado** | Exige base de dados externa; escopo de produto comercial |
| Upload de vídeo da crise | **Descartado** | Fora do escopo do protótipo; risco de LGPD e armazenamento |
| Diário diário de sono/humor | **Descartado** | Exigiria entidade nova; o form de gatilho já captura sono e humor |
| Reminders "stoppable" e medicação de emergência | **Descartado** | Escopo clínico além do TCC |
| Integração com Google Calendar | **Descartado** | Fora do escopo offline-first |
| Paleta roxa | **Descartado** | Decisão D-01: manter azul-marinho atual, tokenizado |
| Login / onboarding | **Descartado** | Fora de escopo da referência (não capturado) |

---

## 5. Síntese: o que o app de referência ensina

Três lições que valem mais que qualquer tela isolada:

1. **A home é um resumo acionável, não um menu.** Gráfico do período + ações principais +
   atalhos. O MySeizures hoje tem uma home que é uma lista de 6 links.
2. **Formulários longos se dividem em decisões pequenas.** O assistente de tratamento mostra que
   3 passos de 1 pergunta batem 1 página de 6 campos.
3. **A forma carrega o significado.** Bottom sheet, botão outline, pílula, stepper — cada forma
   comunica um tipo de interação. É o *affordance percebido* (Norman) aplicado a mobile, e é o
   que separa "um protótipo" de "um produto" na demonstração.

---

## 6. Uso responsável desta referência

- As capturas pertencem a um **produto de terceiros** e servem apenas como referência interna de
  **padrões de interação**, não de identidade visual.
- Nenhum texto, ativo, nome de tela ou código foi copiado. O que foi aproveitado são **decisões
  de interação**, reimplementadas do zero com os tokens e a arquitetura do MySeizures.
- Em nenhum artefato do TCC (artigo, apresentação, repositório) as capturas devem ser reproduzidas.
  Se o material for compartilhado, citar a fonte.
