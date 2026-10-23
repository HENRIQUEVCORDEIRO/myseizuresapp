# MySeizures — Padrões de Interface e Telas

> Inventário de telas, wireframes, os três fluxos dourados (medidos pelas SC) e a matriz de estados.
>
> **Status:** v1.0 · **Data:** 20/10/2026 · **Complementa:** `docs/visual-design-system.md`

---

## 1. Mapa de navegação

```
RootLayout  (AuthSessionProvider)
├── (auth)/index                     Sign in
├── (patient)/_layout                ProtectedRoute [PATIENT]  → Tabs
│   ├── index                        Início
│   ├── (tabs)
│   │   ├── registros/               Registros (histórico)
│   │   ├── tratamentos/             Tratamentos
│   │   └── compartilhar/            Compartilhar
│   ├── seizures/new                 Nova crise        (modal)
│   ├── triggers/new                 Novo gatilho     (modal)
│   ├── treatments/new               Assistente 3 passos
│   ├── reminders                    Lembretes e doses
│   └── sharing                      Acesso profissional
├── (professional)/_layout           ProtectedRoute [MEDIC_CARETAKER] → Tabs
│   ├── index                        Início (lista de pacientes autorizados)
│   └── reports/[patientId]          Relatório do paciente
└── (shared)/report-export           Exportar JSON
```

**Mudança estrutural em relação a 20/10/2026:** o grupo `(patient)` deixa de ser uma pilha de
telas e passa a ter **4 abas** (`Início · Registros · Tratamentos · Compartilhar`), com os fluxos
de registro (`Nova crise`, `Novo gatilho`) como **modais** sobre a aba Início. Motivo: padrão 1 do
app de referência e requisito de *affordance percebido* (P2) — o usuário precisa ver para onde ir.

---

## 2. Fluxos dourados

São os três fluxos medidos pelos testes de usabilidade. Cada um tem um **orçamento de ações** e
um **tempo-alvo** (SC-001/002/003).

### 2.1 Fluxo A — Registrar uma crise (SC-001: < 60 s)

| # | Ação | Toques | Observação |
|---|---|---|---|
| 1 | Tocar em **"Registrar crise"** na home | 1 | Alvo grande, primeiro elemento da tela |
| 2 | Modal abre com **data/hora = agora** e tipo **não selecionado** | 0 | Pré-preenchido; nada a digitar |
| 3 | Tocar no tipo (ex.: "Focal") | 1 | `ChoiceGroup`, sem abrir menu |
| 4 | *(opcional)* "Sentiu que viria?" → Não | 1 | Já **não** selecionado por padrão |
| 5 | Tocar em **Salvar** | 1 | Habilitado só quando válido |
| | **Total** | **4 toques** | **Meta: ≤ 5 toques, ≤ 60 s** |

**A11y:** o botão Salvar anuncia "Salvar crise"; o modal anuncia o tipo de crise selecionado via
`accessibilityState={{ selected: true }}`; o resumo de sucesso usa `liveRegion="polite"`.

### 2.2 Fluxo B — Criar tratamento e confirmar dose (SC-002: < 2 min)

| # | Ação | Toques |
|---|---|---|
| 1 | Tocar em **"Registrar tratamento"** | 1 |
| 2 | Assistente passo 1 → nome do tratamento (digitação) | ~2 |
| 3 | Passo 1 → tipo (`Medicação`) | 1 |
| 4 | Passo 2 → "1× ao dia" | 1 |
| 5 | Passo 2 → horário: **"Manhã"** (atalho) ou picker | 1–2 |
| 6 | Passo 3 → **"Hoje"** | 1 |
| 7 | Tocar em **Confirmar** | 1 |
| 8 | Home → tocar em **"Confirmar dose"** → dose de hoje | 1–2 |
| 9 | Tocar em **"Tomada"** | 1 |
| | **Total** | **10–11 toques** | **Meta: ≤ 12 toques, ≤ 120 s** |

**Mudança crítica:** o passo 2 usa **botões de escolha** para "quantas vezes ao dia" e **atalhos
("Manhã", "Almoço", "Noite")** além do picker de hora. O texto separado por vírgula
(`baseTimes.join(', ')`) desaparece — ele é a principal causa de falha do fluxo.

### 2.3 Fluxo C — Profissional encontra o relatório (SC-003: < 1 min)

| # | Ação | Toques | Observação |
|---|---|---|---|
| 1 | Sign in como profissional | — | Credencial de demonstração |
| 2 | Home do profissional → **"Pacientes com acesso"** (lista) | 1 | **Não** digitar ID numérico |
| 3 | Tocar no paciente (ex.: "Paciente 1") | 1 | |
| 4 | Relatório abre já no período padrão (semana) | 0 | **Carregado no mount** |
| 5 | Ler alertas e adesão | 0 | Alertas no topo, não no fim |
| | **Total** | **2 toques** | **Meta: ≤ 3 toques, ≤ 60 s** |

**Mudança crítica:** hoje o profissional precisa **digitar "1"** num campo numérico e a home dele
é uma tela morta. Isso é falha garantida na SC-003.

### 2.4 Fluxo D — Revogar acesso (SC-004: 100% negação)

Compartilhar → tocar em "Revogar" → confirmar → voltar ao profissional → o paciente **não** aparece
na lista e o relatório responde **negação não divulgadora** ("Este paciente não concedeu acesso a
você. Nenhuma informação clínica está disponível.").

---

## 3. Wireframes

### 3.1 Home do paciente

```
┌────────────────────────────────────────┐
│ Home                              [ + ] │
│ Bom dia, Ana                          │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⚡  Registrar crise            →    │ │
│ │     Data, hora e tipo.             │ │
│ ├────────────────────────────────────┤ │
│ │ 🌙  Registrar gatilho         →    │ │
│ │     Causa, sono e humor.           │ │
│ ├────────────────────────────────────┤ │
│ │ 💊  Confirmar dose            →    │ │
│ │     1 dose aguardando confirmação. │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Minha semana                           │
│ ┌──────┬──────┬──────┐                 │
│ │Semana│ Mês  │ Ano  │  ← Segmented    │
│ └──────┴──────┴──────┘                 │
│ ┌────────┬────────┬────────┐           │
│ │   2    │   3    │  100%  │  ← StatTile│
│ │convuls.│gatilhos│adesão  │           │
│ └────────┴────────┴────────┘           │
│                                        │
│ Minha descrição de crises         →   │
│ Tratamentos                        →  │
│ Compartilhar com profissionais     →   │
└────────────────────────────────────────┘
```

### 3.2 Nova crise (modal)

```
┌────────────────────────────────────────┐
│ ✕   Nova crise                         │
│                                        │
│ Bom restabelecimento. Detalhe o que    │
│ puder — isso ajuda você e a sua equipe.│
│                                        │
│ Quando?                               │
│ ┌────────────────────────────────────┐ │
│ │ Hoje, 20/10 · 21:47          [ 📅 ]│ │
│ └────────────────────────────────────┘ │
│                                        │
│ Tipo                                   │
│ ┌──────────────┬──────────────┐       │
│ │ FOCAL        │ GENERALIZADA │       │
│ └──────────────┴──────────────┘       │
│ ┌──────────────┬──────────────┐       │
│ │ DESCONHECIDO │ OUTRA        │       │
│ └──────────────┴──────────────┘       │
│                                        │
│ Você sentiu que viria?                 │
│ ( ● Não    ○ Sim )                     │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │             Salvar                 │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 3.3 Assistente de tratamento (3 passos)

```
┌────────────────────────────────────────┐
│ ←  Tratamento                          │
│        ( ① )────( ② )────( ③ )        │
│        Info   Freq.   Período           │
│ ─────────────────────────────────────  │
│                                        │
│ Motivo do tratamento                   │
│ ┌────────────────────────────────────┐ │
│ │ Epilepsia                        ▾ │ │
│ └────────────────────────────────────┘ │
│ Tipo                                   │
│ ┌────────────────────────────────────┐ │
│ │ Medicação                        ▾ │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────┐  ┌───────────────────┐  │
│ │  Anterior  │  │      Próximo      │  │
│ └────────────┘  └───────────────────┘  │
└────────────────────────────────────────┘
```

Passo 2: "Quantas vezes ao dia?" (botões) + "Em que horários?" (atalhos Manhã/Almoço/Noite +
picker) + "Quanto por dose?" (campo opcional).
Passo 3: "Começou quando?" (Hoje / Outra data) + "Termina quando?" (Não / Definir data).

### 3.4 Relatório do profissional

```
┌────────────────────────────────────────┐
│ Relatório · Paciente 1                 │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⚠ ALERTA · ALTA                    │ │
│ │ Foram registradas 3 convulsões no   │ │
│ │ período. Indicador informativo.     │ │
│ │ Regra prototype-1.0                 │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Resumo do período            ▾     │ │
│ │ Convolsjões 3 · Gatilhos 4         │ │
│ │ Adesão 66.7% (2 de 3 doses)        │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Tendências de gatilhos        ▾     │ │
│ │ Sono 2 · Estresse 1 · Rotina 1     │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Auras                         ▾     │ │
│ │ 33.3% das convulsões tiveram aura  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [ Exportar JSON ]                      │
│                                        │
│ ⓘ Estes indicadores são informativos.   │
│   Não são diagnósticos...              │
└────────────────────────────────────────┘
```

---

## 4. Matriz de estados por tela

Toda tela com dado implementa os cinco estados. `ApplicationState` (existente) cobre `loading`,
`empty`, `error` e `forbidden`; falta padronizar o `success` feedback (usa `FormFeedback`).

| Tela | Loading | Empty | Error | Forbidden | Success |
|---|---|---|---|---|---|
| Home paciente | skeleton dos StatTile | "Nenhum registro neste período" | "Não foi possível carregar" + Tentar de novo | n/a | feedback de salvar |
| Nova crise | botão Salvar em `busy` | n/a | mensagem inline no campo | n/a | "Crise registrada" + `liveRegion` |
| Registros (histórico) | `ActivityIndicator` | "Nenhum evento no período" | erro + Tentar de novo | n/a | n/a |
| Tratamentos | lista em `busy` | "Nenhum tratamento ativo" | erro + Tentar de novo | n/a | "Tratamento salvo" |
| Lembretes | lista em `busy` | "Nenhuma dose a confirmar" | erro + Tentar de novo | n/a | "Dose confirmada" |
| Relatório | `ApplicationState loading` | "Nenhum registro neste período" | "Não foi possível carregar" | **"Acesso negado"** (não revela dados) | n/a |
| Compartilhar | lista em `busy` | "Nenhum profissional com acesso" | erro + Tentar de novo | n/a | "Acesso concedido/revogado" |
| Home profissional | lista em `busy` | "Nenhum paciente compartilhou dados" | erro + Tentar de novo | n/a | n/a |
| Export | botão em `busy` | n/a | "Não foi possível criar o arquivo" | "Acesso negado" | "Arquivo salvo: <uri>" |

**Regra de não divulgação:** as telas `forbidden` **nunca** revelam se o paciente existe, se houve
dados no período, ou qual era o conteúdo. Mensagem única:
*"Este paciente não concedeu acesso a você. Nenhuma informação clínica está disponível."*

---

## 5. Inventário de componentes (antes → depois)

| Componente | Hoje (20/10) | Depois (D1–D7) | Origem do padrão |
|---|---|---|---|
| Botão | `AccessibleButton` com 2 variantes | `Button` com 4 variantes + `size` | referência 5, 6 |
| Campo | `FormField` (texto) | `Field` (tokens) + `ChoiceGroup` + `SelectSheet` | referência 4, 6 |
| Seleção de período | `SelectField` repetido em 3 telas | `SegmentedControl` único | referência 2 |
| Lista de eventos | `ClinicalEventItem` | idem, com tokens + ícone por tipo | P3 |
| Gráfico de barras | `ReportSummaryChart` (texto) | idem + `StatTile` no topo | referência 9 |
| Cartão | inexistente | `Card` | referência 1 |
| Estado de aplicação | `ApplicationState` | idem, migrado para tokens | — |
| Bottom sheet | inexistente | `SelectSheet` | referência 4 |
| Menu inferior | inexistente | `Tabs` do Expo Router | referência 1 |

---

## 6. Ordem de implementação (por dependência)

1. `tokens.js` → 2. primitivas de UI → 3. `Tabs` + home → 4. forms (crise, gatilho) →
5. assistente de tratamento → 6. home do profissional → 7. relatório + export →
8. offline + rascunho + `Undo` → 9. acessibilidade + rede de apoio

Cada passo é **demonstrável isoladamente** (regra do incremento demonstrável) e termina com
`npm run lint` e `npm test` verdes.
