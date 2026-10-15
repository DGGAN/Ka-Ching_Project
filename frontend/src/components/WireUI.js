// 导入 React Native 原生界面组件与我们的主题颜色配置
// Import React Native core UI components and our theme color configuration
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme/theme';

// 1. 通用硬朗边框卡片 (WireBox)
// 1. Universal Neo-brutalist bordered card (WireBox)
export const WireBox = ({ children, style }) => (
    <View style={[styles.wireBox, style]}>
        {children}
    </View>
);

// 2. 通用输入框组件 (WireInput)
// 2. Universal text input component (WireInput)
export const WireInput = ({ label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputBox}>
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize="none"
            />
        </View>
    </View>
);

// 3. 通用按钮组件 (WireButton)
// 3. Universal button component (WireButton)
export const WireButton = ({ label, onPress, variant = 'filled', style }) => {
    const isFilled = variant === 'filled';
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.buttonBase,
                isFilled ? styles.buttonFilled : styles.buttonOutline,
                style
            ]}
        >
            <Text style={isFilled ? styles.buttonTextFilled : styles.buttonTextOutline}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

// 4. 通用分类标签小方块 (WireChip)
// 4. Universal filter/category chip component (WireChip)
export const WireChip = ({ label, active = false, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.chipBase, active ? styles.chipActive : styles.chipInactive]}
    >
        <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
            {label}
        </Text>
    </TouchableOpacity>
);

// 使用主题变量 (COLORS) 定义样式，保证切换主题时全自动变色
// Define styles using theme variables (COLORS) for automatic recoloring on theme switch
const styles = StyleSheet.create({
    wireBox: {
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        padding: 12,
    },
    inputContainer: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 10,
        fontFamily: FONTS.mono,
        color: COLORS.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputBox: {
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.inputBg,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    textInput: {
        fontSize: 13,
        fontFamily: FONTS.mono,
        color: COLORS.text,
        padding: 0,
    },
    buttonBase: {
        width: '100%',
        borderWidth: 2,
        borderColor: COLORS.border,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonFilled: {
        backgroundColor: COLORS.primary,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
    },
    buttonTextFilled: {
        color: COLORS.primaryText,
        fontSize: 12,
        fontFamily: FONTS.mono,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    buttonTextOutline: {
        color: COLORS.text,
        fontSize: 12,
        fontFamily: FONTS.mono,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    chipBase: {
        borderWidth: 2,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
    },
    chipInactive: {
        backgroundColor: COLORS.card,
    },
    chipText: {
        fontSize: 10,
        fontFamily: FONTS.mono,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chipTextActive: {
        color: COLORS.primaryText,
        fontWeight: 'bold',
    },
    chipTextInactive: {
        color: COLORS.text,
    },
});