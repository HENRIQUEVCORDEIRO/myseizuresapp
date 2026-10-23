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
| **N6** | revisão humana no aparelho: TalkBack, fonte dinâmica, toque real | 👤 autor |

> **N6 é a única verificação que exige o autor.** Todos os demais níveis são automatizados.

---

## 2. Painel dos dias

| Dia | Data | Entrega | N0 | N1 | N2 | N3 | N4 | N5 | N6 | Registro |
|---|---|---|---|---|---|---|---|---|---|---|
| **D1** | seg 20/10 | Documentação, design tokens, 10 primitivas de UI | — | ✅ 241 | ✅ | ✅ 17 | — | — | — | [d1](2026-10-20-d1.md) |
| **D2** | ter 21/10 | Tab bar (4 abas) + home do paciente redesenhada | ✅ | ✅ 246 | ✅ | ✅ 8 | ⏳ | — | — | [d2](2026-10-21-d2.md) |
| D3 | qua 22/10 | Formulário de crise | | | | | | | | |
| D4 | qui 23/10 | Formulário de gatilho | | | | | | | | |
| D5 | seg 26/10 | Assistente de tratamento em 3 passos | | | | | | | | |
| **W** | ter 27/10 | Trilha web: `react-native-web` + composição por plataforma | | | | | | ✅ | | |
| D6 | ter 27/10 | Home do profissional | | | | | | | | |
| D7 | qua 28/10 | Relatório unificado com export | | | | | | | | |
| D8 | qui 29/10 | Offline real, rascunho, `Undo`, métrica de auras | | | | | | | |
| D9 | sex 30/10 | Acessibilidade, rede de apoio, evidência, entrega | | | | | | | | |

**Legenda:** ✅ passou · ⏳ pendente · ⚠️ falhou · — não aplicável

---

## 3. Estado acumulado

| Métrica | D1 | D2 | Alvo em 30/10 |
|---|---|---|---|
| Suítes de teste | 38 | **39** | 46 |
| Testes | 241 | **246** | ~300 |
| Primitivas de UI | 10 | 10 | 12 |
| Linhas de código de apresentação | 6.670 | +420 | — |
| Documentos | 11 | **13** | 16 |
| Funcionalidades da matriz implementadas (parcial ou total) | 8/13 | 8/13 | 11/13 |

---

## 4. Arquivos prontos para commit

> O autor faz o commit manualmente. Esta lista cresce a cada dia.

| Arquivo | Alterado | Motivo |
|---|---|---|
| `.specify/memory/constitution.md` | M | v1.1.0 — Princípio VI |
| `README.md` | M | índice da documentação |
| `docs/architecture.md` | M | contrato de sessão corrigido |
| `mobile/app/(patient)/_layout.js` | M | Stack com o grupo de abas |
| `mobile/app/(patient)/(tabs)/_layout.js` | **A** | barra de abas |
| `mobile/app/(patient)/(tabs)/index.js` | **A** | home redesenhada |
| `mobile/app/(patient)/(tabs)/calendar.js` | **R** | movido |
| `mobile/app/(patient)/(tabs)/sharing.js` | **R** | movido |
| `mobile/app/(patient)/(tabs)/treatments.js` | **R** | movido |
| `mobile/app/(patient)/index.js` | **D** | substituído pela home |
| `mobile/app/(patient)/calendar.js` | **D** | movido |
| `mobile/app/(patient)/sharing.js` | **D** | movido |
| `mobile/app/(patient)/treatments/index.js` | **D** | movido |
| `mobile/src/presentation/theme/tokens.js` | **A** | tokens |
| `mobile/src/presentation/components/ui/*` (11) | **A** | primitivas |
| `mobile/src/presentation/components/index.js` | M | barrel |
| `mobile/tests/unit/presentation/uiPrimitives.test.js` | **A** | 17 testes |
| `mobile/tests/presentation/patientHome.test.js` | M | reescrito |
| `mobile/tests/presentation/patientNavigation.test.js` | **A** | 4 abas |
| `mobile/tests/presentation/calendar.test.js` | M | import |
| `mobile/tests/presentation/sharingManagement.test.js` | M | import |
| `mobile/tests/integration/us1-offline-flow.test.js` | M | import + contrato |
| `mobile/tests/integration/privacyAccess.test.js` | M | contrato de sessão |
| `mobile/app/(patient)/seizures/new.js` | M | prop `initialOccurredAt` |
| `mobile/app/(patient)/triggers/new.js` | M | prop `initialRecordedAt` |
| `mobile/app/(patient)/index.js` | M | `catch` vazio do lint |
| `docs/**` (13 documentos) | **A** | documentação |
| `.gitignore` | M | material local + `/mobile/android` |

**A** = adicionado · **M** = modificado · **R** = renomeado · **D** = removido

> **Não versionados por decisão do autor:** `docs/EBook - Experiencia_do_Usuario_em_Interfaces_
> Digitais.pdf` (copyright EDUFRN) e `docs/Fluxo - outro app epilepsia/` (UI de app comercial).
> A matriz `docs/fix_pesquisa_TCC.pdf` **é** versionada.
