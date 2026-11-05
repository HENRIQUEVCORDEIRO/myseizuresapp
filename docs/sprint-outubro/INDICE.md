# Sprint de outubro/2026 — Painel

> Registro diário da sprint de rework de interface do MySeizures (20 → 30/out/2026).
> Cada dia tem um arquivo próprio. Este índice é o painel: **é ele que mostra, a cada dia, se o
> app está funcional e o que falta**.

**Plano completo:** [`docs/plano-geral-outubro-2026.md`](../plano-geral-outubro-2026.md) ·
**PMV:** [`docs/pmv-outubro-2026.md`](../pmv-outubro-2026.md) ·
**Protocolo de verificação:** §13 do plano geral

---

## 1. Níveis de verificação

| Nível | O que prova | Quem executa |
|---|---|---|
| **N0** | `npx expo export --platform android` — **o app empacota** | 🤖 agente |
| **N1** | `npm test` — suíte completa verde | 🤖 agente |
| **N2** | `npm run lint` + `npm run format:check` | 🤖 agente |
| **N3** | **teste novo** para a feature do dia (prova que funciona, não só que não quebrou) | 🤖 agente |
| **N4** | **no aparelho**, via `adb` — instalar, abrir, capturar tela e ler a imagem | 🤖 agente |
| **N5** | **na web** — `expo export --platform web` servido em `localhost` | 🤖 agente |
| **N6** | revisão humana pontual no aparelho: fonte dinâmica e toque real; **TalkBack já validado no D2, não repetir** | 👤 autor |

> **N6 é pontual, não diário.** O TalkBack foi validado uma vez no D2 (26/10) e não volta ao
> checklist recorrente. Todos os demais níveis são automatizados.

---

## 2. Painel dos dias

| Dia | Data | Entrega | N0 | N1 | N2 | N3 | N4 | N5 | N6 | Registro |
|---|---|---|---|---|---|---|---|---|---|---|
| **D1** | seg 20/10 | Documentação, design tokens, 10 primitivas de UI | — | ✅ 241 | ✅ | ✅ 17 | — | — | — | [d1](2026-10-20-d1.md) |
| **D2** | ter 21/10 | Tab bar (4 abas) + home do paciente + fechamento D2.1 (identidade, doses, datas PT-BR) | ✅ | ✅ 260 | ✅ | ✅ | ✅ | — | ✅ | [d2](2026-10-21-d2.md) |
| **D3** | qua 22/10 | Formulário de crise (agora, `ChoiceGroup`, `feltAura`) | ✅ | ✅ 267 | ✅ | ✅ | ✅ | — | — | [d3](2026-10-22-d3.md) |
| **D4** | qui 23/10 | Formulário de gatilho (agora, `SelectSheet` multi, sono/humor) | ✅ | ✅ 278 | ✅ | ✅ | ✅ | — | — | [d4](2026-10-23-d4.md) |
| **D5** | seg 26/10 | Assistente de tratamento em 3 passos + dose em 1 toque | ✅ | ✅ 287 | ✅ | ✅ | ✅ | — | — | [d5](2026-10-29-d5.md) |
| **W** | ter 27/10 | Trilha web: `react-native-web` + composição por plataforma | | | | | | ✅ | | |
| **D6** | ter 27/10 | Home do profissional com lista de pacientes autorizados | ✅ | ✅ 292 | ✅ | ✅ | ✅ | — | — | [d6](2026-10-30-d6.md) |
| **D7** | qua 28/10 | Relatório unificado com export, disclaimer e notas de rodapé | ✅ | ✅ 293 | ✅ | ✅ | ✅ | — | — | [d7](2026-11-02-d7.md) |
| **D8** | qui 29/10 | Offline real, rascunho, `Undo`, métrica de auras | ✅ | ✅ 308 | ✅ | ✅ | ✅ | — | — | [d8](2026-11-03-d8.md) |
| D9 | sex 30/10 | Acessibilidade, rede de apoio, evidência, entrega | | | | | | | | |

**Legenda:** ✅ passou · ⏳ pendente · ⚠️ falhou · — não aplicável

---

## 3. Estado acumulado

| Métrica | D1 | D2 | D3 | D7 | D8 | Alvo em 30/10 |
|---|---|---|---|---|---|---|
| Suítes de teste | 38 | 43 | 43 | 44 | **47** | 46 |
| Testes | 241 | 260 | 267 | 293 | **308** | ~300 |
| Primitivas de UI | 10 | 10 | 10 | 10 | 10 | 12 |
| Linhas de código de apresentação | 6.670 | +420 | +30 | — | — | — |
| Documentos | 11 | 13 | 14 | 18 | **19** | 16 |
| Funcionalidades da matriz implementadas (parcial ou total) | 8/13 | 8/13 | 8/13 | 8/13 | **9/13** | 11/13 |

---

## 4. Arquivos prontos para commit

> O autor faz o commit manualmente. Os commits 1–10 do plano já estão no histórico
> (`git log --oneline`); esta seção lista **somente o que ainda está na árvore de trabalho**.

### 4.1 D2.1 — commitado

O fechamento D2.1 já está no histórico (`6e2d8c7`), incluindo identidade local, PT-BR, doses,
documentação e evidências. TalkBack validado pelo autor em 26/10.

### 4.2 D3 — commitado

O D3 está no histórico (`87aab8e` e `3f40493`), incluindo aura, horário atual, migração 003,
documentação e evidências. TalkBack validado no D2.

### 4.3 D4 — commitado

O D4 está no histórico (`b8b35c6` e `0df33cb`), incluindo formulário de gatilho, causas múltiplas,
migração 004, documentação e evidências. O TalkBack não foi repetido; permanece validado no D2.

### 4.4 D5 — commitado

O D5 está no histórico (`06b913c` e `5b2c1bd`), incluindo o assistente de tratamento, a confirmação
de dose em 1 toque, a migração 005, a documentação e as evidências.

### 4.5 D6 — commitado

O D6 está no histórico (`1881779`, `6407940` e `a664ae3`), incluindo endpoint do profissional,
home com lista de pacientes autorizados, alias sem ID, testes, documentação e evidências.

### 4.6 D7 — commitado

O D7 está no histórico (`abbc54f` e `ce614d0`), incluindo o relatório unificado, o export do período
carregado, as notas por métrica, o disclaimer fixo, os testes, a documentação e as evidências.

### 4.7 D8 — na árvore de trabalho

| Área | Arquivos principais | Alterado | Motivo |
|---|---|---|---|
| Rascunho | `useFormDraft.js`, `ManageFormDraft.js`, `FormDraftRepository.js`, migração `006` | A/M | rascunho persistente por paciente e formulário |
| Crise e gatilho | `seizures/new.js`, `triggers/new.js`, `DeleteSeizure.js`, `DeleteTrigger.js` | M/A | restauração, autosave, limpeza, `Undo` de 5 s e padding acima da nav bar |
| Relatório | `reportingRules.js`, `GenerateReport.js`, `ProfessionalReport.js` | M | métrica de auras no relatório, sem alterar o JSON exportado |
| Composição | `container.js` | M | liga rascunho e remoção aos fluxos do paciente |
| Testes | `clinicalRecords`, `authSessionProvider`, `formDraftRepository`, `formDraftUseCases`, `clinicalUseCases`, `reportingRules`, `reportingUseCases`, `professionalReport`, `databaseBootstrap`, `us3-sharing-report-flow` | M/A | rascunho, `Undo`, aura, sessão offline e autoacesso sem API |
| Documentação | `2026-11-03-d8.md`, `INDICE.md`, `evidencias/d8/` | A/M | D8 e N0–N4; capturas e estado local observado |

```bash
# Código do D8.
git add \
  'mobile/app/(patient)/seizures/new.js' \
  'mobile/app/(patient)/triggers/new.js' \
  mobile/src/application/use-cases/clinical/DeleteSeizure.js \
  mobile/src/application/use-cases/clinical/DeleteTrigger.js \
  mobile/src/application/use-cases/clinical/index.js \
  mobile/src/application/use-cases/drafts/ManageFormDraft.js \
  mobile/src/application/use-cases/drafts/index.js \
  mobile/src/application/use-cases/reporting/GenerateReport.js \
  mobile/src/composition/container.js \
  mobile/src/domain/rules/reportingRules.js \
  mobile/src/infrastructure/persistence/migrations/006_form_drafts.js \
  mobile/src/infrastructure/persistence/migrations/index.js \
  mobile/src/infrastructure/persistence/repositories/FormDraftRepository.js \
  mobile/src/infrastructure/persistence/repositories/index.js \
  mobile/src/presentation/features/reports/ProfessionalReport.js \
  mobile/src/presentation/hooks/useFormDraft.js \
  mobile/tests/integration/databaseBootstrap.test.js \
  mobile/tests/integration/formDraftRepository.test.js \
  mobile/tests/integration/us3-sharing-report-flow.test.js \
  mobile/tests/presentation/authSessionProvider.test.js \
  mobile/tests/presentation/clinicalRecords.test.js \
  mobile/tests/presentation/professionalReport.test.js \
  mobile/tests/unit/application/clinical/clinicalUseCases.test.js \
  mobile/tests/unit/application/drafts/formDraftUseCases.test.js \
  mobile/tests/unit/application/reportingUseCases.test.js \
  mobile/tests/unit/domain/reportingRules.test.js
git commit -m "feat: add offline drafts, undo and aura reporting"

# Evidências e resultado do N4.
git add \
  docs/sprint-outubro/2026-11-03-d8.md \
  docs/sprint-outubro/INDICE.md \
  docs/sprint-outubro/evidencias/d8
git commit -m "docs(sprint): record D8 device checks"
```

**Fora dos commits:** `.specify/`, `prompts/`, `docs/instructions/`, `docs/fix_pesquisa_TCC.pdf`.

### 4.8 Próximo

O D8 está concluído em N0–N4 e pronto para o commit manual. Seguir para **D9** (acessibilidade,
“descrição de crises”, pessoa de contato, evidências e protocolo de usabilidade/TCLE). Quando
`react-native-web` estiver disponível, retomar a trilha web (N5). A tradução PT-BR não é uma
pendência separada; identificadores, domínio, API e testes de domínio permanecem em inglês. O safe
area do botão **Confirmar** da `SelectSheet` e a atualização automática do fim do período em
**Registros** continuam como melhorias de UX herdadas do D4.

**A** = adicionado · **M** = modificado · **R** = renomeado · **D** = removido

> **Não versionados por decisão do autor:** `docs/EBook - Experiencia_do_Usuario_em_Interfaces_
> Digitais.pdf` (copyright EDUFRN) e `docs/Fluxo - outro app epilepsia/` (UI de app comercial).
> Nesta rodada, também ficam fora dos commits a matriz `docs/fix_pesquisa_TCC.pdf`, o diretório
> `docs/instructions/` e as pastas de ferramenta `.specify/` e `prompts/`.
