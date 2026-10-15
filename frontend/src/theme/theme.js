// 定义不同风格的主题调色板，方便随时一键切换全 App 颜色风格
// Define color palettes for different themes to easily switch app-wide styling anytime
export const THEMES = {
  // 主题 1：严格还原你 Figma 报告的黑白极简新粗野主义风格 (Wireframe Monochrome)
  // Theme 1: Monochrome Neo-Brutalism matching your Figma wireframe report
  wireframe: {
    background: "#F0F0F0", // 页面浅灰底色 / Screen light gray background
    card: "#FFFFFF", // 卡片纯白底色 / Card pure white background
    text: "#111111", // 主要文字深黑色 / Primary text dark black
    textMuted: "#666666", // 次要文字灰色 / Secondary muted gray text
    primary: "#111111", // 主按钮与主强调色（黑） / Primary button & accent color (Black)
    primaryText: "#FFFFFF", // 主按钮上的文字颜色（白） / Text color on primary button (White)
    secondary: "#E0E0E0", // 次级背景色（浅灰块） / Secondary background color (Light gray)
    inputBg: "#F7F7F7", // 输入框背景色 / Input field background color
    border: "#111111", // 硬朗黑框线条颜色 / Hard border color
    borderMuted: "#D4D4D4", // 虚线或弱化边框颜色 / Dashed or muted border color
    danger: "#D4183D", // 错误与超支警告红 / Error and overspending alert red
    dangerBg: "#FFEBEE", // 错误提示框浅红底色 / Error box light red background
    success: "#16A34A", // 收入与达标绿 / Income and goal achieved green
  },

  // 主题 2：招财绿现代金融风格（以后想换彩色时，直接切换成这个！）
  // Theme 2: Ka-Ching Emerald Fintech Style (Switch to this anytime for a colorful UI!)
  emerald: {
    background: "#F4F9F6", // 薄荷浅灰白底色 / Mint-tinted off-white background
    card: "#FFFFFF", // 纯白卡片 / Pure white card
    text: "#0F291E", // 深森林绿文字 / Deep forest green text
    textMuted: "#5C7A6B", // 柔和灰绿次要文字 / Muted sage green secondary text
    primary: "#10B981", // 招财翡翠绿主按钮 / Ka-Ching Emerald green primary button
    primaryText: "#FFFFFF", // 按钮白字 / White text on primary button
    secondary: "#E6F4EA", // 浅绿次级块 / Light emerald secondary block
    inputBg: "#FFFFFF", // 纯白输入框 / Pure white input background
    border: "#0F291E", // 深绿硬朗边框 / Deep green hard border
    borderMuted: "#B8D8C5", // 柔和绿分割线 / Soft green divider border
    danger: "#EF4444", // 警告红 / Alert red
    dangerBg: "#FEF2F2", // 浅红背景 / Light red background
    success: "#059669", // 成功绿 / Success green
  },
};

// 💡 控制台：在这里修改 'wireframe' 或 'emerald'，即可一键改变整个 App 的颜色！
// 💡 Control Switch: Change between 'wireframe' and 'emerald' here to recolor the entire App!
const ACTIVE_THEME = "emerald";

// 导出当前激活的颜色配置与通用字体规范
// Export currently active color palette and global typography settings
export const COLORS = THEMES[ACTIVE_THEME];

export const FONTS = {
  mono: "monospace", // 对应你设计稿中的 DM Mono 等宽字体风格 / Matches DM Mono font from your design
};
