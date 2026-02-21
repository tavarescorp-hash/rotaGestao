# Contribuindo com a UniBeer 2025 🚀

Olá! Que ótimo ter você por aqui. Estamos construindo o **Rota Gestão**, nossa plataforma premium de gestão e execução de mercado para a UniBeer. 

Este guia foi criado para ajudar você a entender nosso fluxo de trabalho, configurar seu ambiente e integrar suas melhorias de forma rápida e segura. Sinta-se em casa e vamos codar juntos!

---

## 🛠 Como configurar o ambiente de desenvolvimento local

Nosso projeto utiliza um stack moderno focado em performance (React, Vite, TypeScript, TailwindCSS e Supabase). Para rodar a aplicação na sua máquina, siga os passos abaixo:

### 1. Pré-requisitos
Certifique-se de ter as seguintes ferramentas instaladas:
- [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)
- Git para controle de versão

### 2. Clonando o repositório
Abra o seu terminal e rode:
```bash
git clone https://github.com/tavarescorp-hash/unibeer2025.git
cd unibeer2025
```

### 3. Instalando as dependências
Utilizamos o `npm` como gerenciador de pacotes padrão:
```bash
npm install
```

### 4. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base, se existir) e adicione as credenciais do nosso backend (Supabase):
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

### 5. Inciando o Servidor de Desenvolvimento
Com tudo pronto, inicie o Vite:
```bash
npm run dev
```
O projeto estará rodando localmente (geralmente em `http://localhost:5173` ou `8081`). 

---

## 🌿 Criando uma Nova Branch

Para mantermos a branch `main` sempre estável, todo novo desenvolvimento (seja uma nova funcionalidade ou correção de bug) deve ser feito em uma branch separada.

Siga nossa convenção de nomenclatura de branches para facilitar a identificação:
- **`feat/nome-da-feature`**: Para novas funcionalidades (ex: `feat/login-page`)
- **`fix/nome-do-bug`**: Para correções de bugs (ex: `fix/calculo-pontuacao`)
- **`refactor/nome-do-refatoramento`**: Para reescrita de código sem alterar comportamento.

**Como criar e mudar para a sua nova branch:**
```bash
# Certifique-se de estar na main e com ela atualizada
git checkout main
git pull origin main

# Crie a sua branch a partir da main
git checkout -b feat/sua-nova-funcionalidade
```

---

## 📝 Padrão de Mensagens de Commit

Para manter nosso histórico de alterações limpo e legível (e facilitar a geração automática de changelogs no futuro), adotamos o padrão **Conventional Commits**.

Cada commit deve ser estruturado da seguinte forma:
`<tipo>(<escopo opcional>): <descrição no imperativo e letra minúscula>`

### Tipos de Commits Permitidos:
- **`feat`**: Uma nova funcionalidade.
- **`fix`**: Correção de um bug.
- **`ui`**: Ajustes visuais, CSS, Tailwind e design de componentes.
- **`docs`**: Alterações na documentação (ex: atualizar o README).
- **`chore`**: Atualização de dependências, builds, ferramentas (sem alteração de código fonte).
- **`refactor`**: Mudança no código que não corrige bug nem adiciona funcionalidade.

### Exemplos Práticos:
✅ **Correto:** `feat(auth): adiciona integração com login do supabase`
✅ **Correto:** `fix(dashboard): corrige calculo da pontuação de FDS`
✅ **Correto:** `ui: altera imagem de fundo da tela de login`

❌ **Incorreto:** `Ajustei o login`
❌ **Incorreto:** `Update NovaVisita.tsx`

*Dica: Seja claro na descrição. Se a alteração for muito complexa, você pode adicionar um corpo ao commit pulando uma linha para explicar o "porquê" da mudança.*

---

## 🤝 Processo de Pull Request (PR)

1. Quando finalizar sua feature na sua branch, faça o push para o GitHub:
   ```bash
   git push origin feat/sua-nova-funcionalidade
   ```
2. Abra um Pull Request (PR) direcionado para a branch `main`.
3. Adicione uma descrição clara do que foi feito e os motivos da mudança. Inclua prints (screenshots) se for uma alteração visual!
4. Marque um colega de equipe para revisar o seu código (Code Review).
5. Após o "Approve" do revisor, você estará livre para fazer o Merge!

Muito obrigado por contribuir e nos ajudar a tornar a Rota Unibeer cada vez melhor! Se tiver dúvidas, não hesite em chamar no chat da equipe. 🍻
