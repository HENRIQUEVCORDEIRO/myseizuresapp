# Boas Práticas de Trabalho com o Agente

> Como pedir, como receber e como registrar as decisões neste projeto.
> Derivado de `docs/instructions/PROMPT.txt` (os 4 Is), do pipeline de
> `docs/instructions/Expert de Desenvolvimento.pdf` e do histórico real de `prompts/`.
>
> **Status:** v1.0 · **Data:** 20/10/2026

---

## 1. Os 4 Is (a estrutura de um bom pedido)

Todo pedido forte tem quatro partes. Faltou alguma, a resposta fica genérica — e a culpa é do
pedido, não da ferramenta.

| I | Nome | O que é | Erro típico quando falta |
|---|---|---|---|
| 1 | **Intenção** | O objetivo, dito **antes** da tarefa. O porquê. | A IA acerta a tarefa e erra o alvo ("escreva um e-mail" tem dez respostas certas) |
| 2 | **Instrução** | O verbo de ação + escopo. O que exatamente. | Pedir **tema** em vez de tarefa ("marketing digital" não é pedido) |
| 3 | **Informação** | O contexto que só você tem: caso, restrições, histórico, o que já foi tentado. | "Ela não entende o meu negócio" — não entende mesmo, e não tem como |
| 4 | **Interação** | Não aceitar a primeira resposta. Comentar e pedir de novo. | Aceitar o rascunho e achar que é a entrega |

### 1.1 O template que resolve quase tudo

> "O meu objetivo é **[o que você quer alcançar]**. Preciso que você me ajude com **[tarefa ou
> dúvida]**. Pergunte o que achar necessário."

O fecho transfere para o agente a responsabilidade de identificar qual Informação é relevante.

### 1.2 Exemplo real, deste projeto

| | |
|---|---|
| ❌ Pedido fraco | "melhora a interface do app" |
| ✅ Pedido completo | **Intenção:** preciso que os participantes registrem uma crise em menos de 60 s, porque é a SC-001 do artigo. **Instrução:** redesenhe a home e o formulário de crise. **Informação:** o app é Expo Router + RN 0.81, tokens ainda não existem, a paleta atual é azul-marinho e deve ser mantida, o build de dev já funciona, testes de apresentação existem em 7 arquivos. **Interação:** quero a versão em wireframes antes de você escrever código. |

### 1.3 A regra do "quando ficar quieto"

> *"Só apareça quando o ganho for real."*

Um pedido que é apenas "um pouco mais detalhado" **não** precisa de correção. Corrigir todo
pedido é ruído e faz a pessoa parar de usar. O gatilho correto é:

- a pessoa **reclamou** do resultado ("a IA não entendeu", "veio genérico");
- o pedido é **ambíguo a ponto** de obrigar a escolher entre caminhos muito diferentes;
- a tarefa é **grande o bastante** para que errar o alvo custe tempo de verdade.

Quando o gatilho dispara, o protocolo é: **uma linha de diagnóstico → o pedido reescrito pronto
para copiar → e a tarefa feita.** Sem aula, sem capítulo de metodologia.

Exemplo de diagnóstico real:

> **Falta Intenção:** você pediu o texto mas não disse para que serve. Reescrito: *"Escreva o
> texto de onboarding do app, para paciente com epilepsia que pode ter dificuldade de concentração
> — precisa ser curto e sem jargão."* Segue com o texto: […]

**Erros a evitar**
- Reescrever o pedido mudando o objetivo do autor — preencha o que falta, não troque a intenção.
- Inventar a Informação que falta: use `[para quem]` marcado, não um palpite convincente.
- Corrigir quem já está pedindo bem: reconhecer um bom pedido vale mais que arrumar um que não
  estava quebrado.

---

## 2. Como revisar o que eu devolvo

**Por evidência, não por descrição.** "Funciona" não é evidência. "A suíte `us1-offline-flow`
passa com a rede bloqueada" é.

| Tipo de afirmação | Aceitável | Não aceitável |
|---|---|---|
| Comportamento | Saída de teste, print, vídeo, log | "deve funcionar", "está pronto" |
| Interface | Screenshot ou gravação do fluxo | "a tela ficou boa" |
| Conformidade | `npm run lint` e `npm test` verdes | "não quebrei nada" |
| Desempenho | Tempo medido com o cronômetro | "ficou rápido" |

**Antes de dizer que está pronto, o agente deve rodar:**

```bash
npm run lint
npm run format:check
npm test
```

**A primeira resposta é rascunho.** O autor revisa e pede a iteração. Em trabalho visual, o
ciclo barato é: **wireframe em texto → aprovação → código**.

---

## 3. Registro de decisão

Toda decisão que muda escopo, arquitetura, linguagem visual ou promessa pública vira **uma linha
em um registro com data, justificativa e alternativa rejeitada**. Sem isso, a conversa se perde e
a mesma discussão reaparece três semanas depois.

Onde registrar:

| Tipo de decisão | Onde |
|---|---|
| Arquitetura / escopo de longo prazo | `docs/adr/NNNN-*.md` (ADR) |
| Decisão de sprint / produto | `docs/plano-geral-outubro-2026.md` §11 |
| Regra de negócio ou clínica | Regra de domínio versionada + teste de fronteira + ADR se mudar a semântica |
| Mudança no código | Commit message no formato já usado pelo projeto |

Formato do commit (já adotado no repositório):

```
<tipo>(<escopo>): <descrição no imperativo>

<corpo: por quê, não o quê>
```

Tipos em uso: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `build`, `perf`.

---

## 4. O que o agente deve e não deve fazer

**Deve**
- Ler o código antes de afirmar qualquer coisa sobre ele.
- Dizer **não sei** e ir verificar, em vez de inferir.
- Marcar suposições como `SUPOSIÇÃO` e pedir confirmação.
- Apontar quando um pedido é vago (uma linha, sem bully).
- Propor a alternativa mais simples que resolve o problema.
- Dizer o que **não** cabe no prazo e sugerir o que entra no lugar.

**Não deve**
- Modificar arquivos fora do escopo pedido.
- Refatorar o que já está correto para "ficar mais bonito".
- Introduzir dependência nova sem justificar o custo.
- Marcar como implementado algo que só está documentado.
- Inventar referência, número de versão, dado clínico ou resultado de pesquisa.

---

## 5. Onde o rigor é obrigatório neste projeto

Três áreas onde um descuido vira problema acadêmico, não só técnico:

1. **Regras clínicas / de alerta.** Toda regra é pura, versionada, testada em fronteira e
   **informativa**. Mudar limiar = nova versão + ADR. (Ver `docs/adr/0002`.)
2. **Acessibilidade.** Regressão é bug. Toda primitiva nova entra com teste automatizado de
   papéis, estados e alvos.
3. **Privacidade / LGPD.** Export com allow-list, sem credenciais, sem dados de outro paciente.
   Teste automatizado obrigatório (`mobile/tests/integration/privacyAccess.test.js`).

---

## 6. Checklist de "pronto" para qualquer entrega

- [ ] `npm run lint` e `npm run format:check` verdes
- [ ] `npm test` verde, com teste **novo** para o comportamento novo
- [ ] Nenhum valor visual escrito à mão — só tokens
- [ ] Acessibilidade conferida (papel, rótulo, estado, alvo ≥ 48 dp, status não só por cor)
- [ ] Estados `loading` / `empty` / `error` / `forbidden` tratados
- [ ] Erro não revela dado sensível nem confirma a existência de dado
- [ ] Documentação atualizada (`docs/`, ADR quando aplicável)
- [ ] Evidência anexada: print, vídeo ou saída de teste
- [ ] O que ficou **fora** está escrito como "trabalhos futuros"
