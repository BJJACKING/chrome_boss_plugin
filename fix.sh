#!/bin/zsh

echo "🔧 开始修复 Powerlevel10k 环境 ..."

# 1️⃣ 检查当前 Shell
if [[ "$SHELL" != *"zsh"* ]]; then
  echo "❌ 当前 shell 不是 zsh，请运行： chsh -s /bin/zsh"
  echo "然后重新打开终端再运行本脚本。"
  exit 1
fi

# 2️⃣ 检查 oh-my-zsh
if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
  echo "⚙️ 未检测到 Oh My Zsh，正在安装..."
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
fi

# 3️⃣ 检查 Powerlevel10k 安装
BREW_PREFIX=$(brew --prefix powerlevel10k 2>/dev/null)
if [[ -z "$BREW_PREFIX" ]]; then
  echo "📦 未通过 brew 安装 Powerlevel10k，尝试通过 git 安装..."
  git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
  P10K_PATH="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
else
  echo "✅ 检测到 Powerlevel10k 来自 brew: $BREW_PREFIX"
  P10K_PATH="$BREW_PREFIX/share/powerlevel10k"
fi

# 4️⃣ 修复主题路径
THEMES_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes"
sudo mkdir -p "$THEMES_DIR"

echo "🔗 创建软链接到 oh-my-zsh themes 目录..."
sudo rm -rf "$THEMES_DIR/powerlevel10k"
sudo ln -s "$P10K_PATH" "$THEMES_DIR/powerlevel10k"

# 5️⃣ 修改 .zshrc 配置
if grep -q '^ZSH_THEME=' ~/.zshrc; then
  sed -i '' 's#^ZSH_THEME=.*#ZSH_THEME="powerlevel10k/powerlevel10k"#' ~/.zshrc
else
  echo 'ZSH_THEME="powerlevel10k/powerlevel10k"' >> ~/.zshrc
fi

# 确保加载配置
if ! grep -q '[[ ! -f ~/.p10k.zsh ]]' ~/.zshrc; then
  echo '[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh' >> ~/.zshrc
fi

# 6️⃣ 检查字体
echo "🔍 检查 MesloLGS Nerd Font ..."
FONT_PATH="$HOME/Library/Fonts/MesloLGSNerdFont-Regular.ttf"
if [[ ! -f "$FONT_PATH" ]]; then
  echo "⚠️ 未检测到 MesloLGS Nerd Font，将尝试下载 ..."
  curl -L -o ~/Library/Fonts/MesloLGSNerdFont-Regular.ttf https://ghproxy.com/https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Regular.ttf
  curl -L -o ~/Library/Fonts/MesloLGSNerdFont-Bold.ttf https://ghproxy.com/https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Bold.ttf
  curl -L -o ~/Library/Fonts/MesloLGSNerdFont-Italic.ttf https://ghproxy.com/https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Italic.ttf
  curl -L -o ~/Library/Fonts/MesloLGSNerdFont-BoldItalic.ttf https://ghproxy.com/https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Bold%20Italic.ttf
else
  echo "✅ 已安装 MesloLGS Nerd Font"
fi

# 7️⃣ 重新加载配置
echo "🔄 重新加载 .zshrc ..."
source ~/.zshrc

# 8️⃣ 运行配置向导
echo "🚀 启动 Powerlevel10k 配置向导 ..."
p10k configure

echo "✅ 完成！现在 Powerlevel10k 应该已经正常运行。"

