# Registro de Decisões (ADR) — MySeizures

> Como escrever um ADR neste projeto, template, índice vivo e o que **exige** um ADR.
>
> **Status:** v1.0 · **Data:** 20/10/2026 · **Local dos ADRs:** `docs/adr/`

---

## 1. O que é um ADR

**Architecture Decision Record** — um registro curto e **imutável** de uma decisão estrutural:
o contexto, a decisão, as consequências e as alternativas rejeitadas.

Um ADR não é uma ata de reunião nem um relatório. Ele existe para responder, meses depois, a
pergunta *"por que diabos fizemos isso?"* — e para impedir que a mesma discussão recomece do zero.

**Três propriedades**

1. **Imutável.** Um ADR aceito não é editado. Ele é **substituído** por outro que o referencie.
   O histórico é append-only.
2. **Curto.** De 1 a 2 páginas. Se passa disso, provavelmente é um design doc — que é outro
   artefato, com outro nome.
3. **Datado e atribuído.** Quem decidiu, quando, e com que status.

---

## 2. O que **exige** um ADR

| Situação | ADR? |
|---|---|
| Mudar a fonte de verdade dos dados clínicos | **Sim** |
| Mudar a semântica de uma regra clínica ou de alerta | **Sim** |
| Adicionar ou remover rota da API | **Sim** |
| Mudar o formato do contrato de export | **Sim** (e nova versão de contrato) |
| Introduzir dependência nova relevante | **Sim** |
| Reposicionar uma promessa pública (matriz, escopo do TCC) | **Sim** |
| Escolher uma biblioteca de UI | **Sim** |
| Refatorar a camada de apresentação | **Não** — vai para o plano de sprint |
| Corrigir bug | **Não** — commit |
| Ajustar texto de tela | **Não** — commit |

**Regra de bolso:** se a decisão **leva 6 meses para ser desfeita** e **alguém vai perguntar por
que**, é ADR.

---

## 3. Template

```markdown
# ADR NNNN: <título na forma de decisão>

- **Status:** Proposto | Aceito | Substituído por ADR NNNN | Rejeitado | Depreciado
- **Data:** AAAA-MM-DD
- **Decisores:** <nomes>

## Contexto

<Qual é o problema? Que forças estão em jogo? O que torna esta decisão necessária agora?>

## Decisão

<O que foi decidido, em uma ou duas frases afirmativas.>

## Consequências

### Positivas
- ...

### Trade-offs e riscos
- ...

## Alternativas consideradas

- **<alternativa>**: rejeitada porque <motivo>.
```

**Regras de escrita**
- **Contexto** antes de **Decisão**. Quem lê só a decisão não entende o porquê.
- **Frases afirmativas** no presente: "O export é mapeado por allow-list", não "deveríamos mapear".
- **Consequências negativas são obrigatórias.** Um ADR só com benefícios não é uma decisão, é
  propaganda.
- **Alternativas rejeitadas** com motivo. É a seção mais consultada.
- **Status `Aceito` só depois** da validação de quem decide. `Proposto` enquanto se debate.

---

## 4. Ciclo de vida

```
Proposto  ──(revisão)──►  Aceito  ──(nova decisão contraditória)──►  Substituído por ADR NNNN
    │                                                                    (o antigo é mantido,
    └──(recusa)──►  Rejeitado                                        referenciado, nunca editado)
```

Um ADR `Rejeitado` **é preservado** e pode ser revisto. Registrar a recusa é tão útil quanto
registrar a aceitação: evita que a mesma ideia seja reproposta sem o contexto que a refutou.

---

## 5. Índice vivo

| ADR | Título | Status | Data | Assunto |
|---|---|---|---|---|
| [0001](0001-local-clinical-source-of-truth.md) | Manter os dados clínicos no SQLite local | Aceito | 2026-08-27 | Fonte de verdade, privacidade, ausência de sincronização |
| [0002](0002-derived-reports-alerts-and-local-export.md) | Derivar relatórios, versionar alertas, exportar localmente | Aceito | 2026-08-27 | Relatórios derivados, regras `prototype-1.0`, export RNDS/e-SUS v1.0 sem transmissão |
| [0003](0003-reposicionamento-da-integracao-sus.md) | Reposicionar a interoperabilidade com o Ecossistema SUS | Proposto | 2026-10-20 | Escopo de interoperabilidade e honestidade da proposta pública |

> Quando este índice mudar, ele é atualizado **no mesmo commit** do ADR.

---

## 6. Onde a decisão também precisa ser registrada

Um ADR não é o único lugar. A mesma decisão pode ter outros efeitos que precisam de registro
próprio:

| Efeito da decisão | Onde registrar |
|---|---|
| Regra de negócio / limiar de alerta | Regra de domínio **versionada** + teste de fronteira + nota no ADR |
| Formato de dado externo | `specs/.../contracts/*.md` com **nova versão** |
| Comportamento de tela | `docs/visual-design-system.md` |
| Escopo e prazo | `docs/pmv-outubro-2026.md` + `docs/plano-geral-outubro-2026.md` §11 |
| Requisito de usabilidade | `docs/usability-study-protocol.md` |
| Tarefa | `specs/.../tasks.md` |

---

## 7. Modelo em branco

Copie o arquivo `docs/practices/decision-records.md` §3 ou use o exemplo acima. Ao criar um ADR
novo:

1. Verifique o maior número existente e use o próximo (`NNNN`).
2. Nomeie o arquivo `NNNN-slug-em-kebab-case.md` na pasta `docs/adr/`.
3. Adicione a linha ao índice da §5.
4. Se a decisão altera comportamento, atualize o documento de arquitetura
   (`docs/architecture.md`) e a rastreabilidade (`specs/.../traceability.md`).
5. Se a decisão é de produto, **atualize a matriz de concorrência** para que a afirmação pública
   permaneça verdadeira.
