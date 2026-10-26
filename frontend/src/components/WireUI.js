// Import React hooks, native UI components with Animated engine, and Lucide icons
import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Animated, StyleSheet } from "react-native";
import {
  Home,
  ArrowLeftRight,
  Plus,
  Wallet,
  BarChart2,
  Bell,
  User,
  ArrowLeft,
  FileText,
  Camera,
  Pencil,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../theme/theme";

// 0. Globally reusable Floating Toast Hook & Component (Animated top alert for all screens)
export const useFloatingToast = () => {
  const [toast, setToast] = useState({ visible: false, type: "error", text: "" });
  const slideAnim = useRef(new Animated.Value(-90)).current;
  const timerRef = useRef(null);

  const showToast = (type, text, duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, type, text });
    slideAnim.setValue(-90);

    Animated.spring(slideAnim, {
      toValue: 12,
      damping: 15,
      stiffness: 180,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setToast((prev) => ({ ...prev, visible: false })));
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, slideAnim, showToast };
};

export const FloatingToast = ({ toast, slideAnim }) => {
  if (!toast.visible) return null;
  const isError = toast.type === "error";

  return (
    <Animated.View style={[styles.floatingToast, isError ? styles.toastError : styles.toastSuccess, { transform: [{ translateY: slideAnim }] }]}>
      {isError ? <AlertCircle size={16} color={COLORS.danger} strokeWidth={2.5} /> : <CheckCircle2 size={16} color="#15803D" strokeWidth={2.5} />}
      <Text style={[styles.floatingToastText, { color: isError ? COLORS.danger : "#15803D" }]}>{toast.text}</Text>
    </Animated.View>
  );
};

// 1. Universal card (automatically switches between sharp square and rounded corners)
export const WireBox = ({ children, style }) => <View style={[styles.wireBox, style]}>{children}</View>;

// 2. Universal input component (automatically applies theme border radius and font)
export const WireInput = ({ label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = "default" }) => (
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

// 3. Universal button component (automatically becomes a pill button in cute pink theme)
export const WireButton = ({ label, onPress, variant = "filled", style }) => {
  const isFilled = variant === "filled";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.buttonBase, isFilled ? styles.buttonFilled : styles.buttonOutline, style]}>
      <Text style={isFilled ? styles.buttonTextFilled : styles.buttonTextOutline}>{label}</Text>
    </TouchableOpacity>
  );
};

// 4. Universal category chip (automatically switches between square and rounded bubble)
export const WireChip = ({ label, active = false, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.chipBase, active ? styles.chipActive : styles.chipInactive]}>
    <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{label}</Text>
  </TouchableOpacity>
);

// 5. Top Header component
export const TopHeader = ({ title = "Ka-Ching!", showBack = false, onBackPress, onBellPress, onProfilePress }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerLeft}>
      {showBack && (
        <TouchableOpacity onPress={onBackPress} style={{ marginRight: 8, padding: 2 }}>
          <ArrowLeft size={18} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
    <View style={styles.headerRight}>
      <TouchableOpacity onPress={onBellPress} style={{ padding: 4 }}>
        <Bell size={18} color={COLORS.text} strokeWidth={2} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onProfilePress} style={styles.avatarBox}>
        <User size={15} color={COLORS.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  </View>
);

// 6. 底部导航栏组件
// 6. Bottom Navigation bar component
export const BottomNav = ({ activeTab = "home", onSelectTab, onPressAdd }) => {
  const leftTabs = [
    { id: "home", label: "Home", Icon: Home },
    { id: "transactions", label: "History", Icon: ArrowLeftRight },
  ];
  const rightTabs = [
    { id: "budget", label: "Budget", Icon: Wallet },
    { id: "insights", label: "Insights", Icon: BarChart2 },
  ];

  return (
    <View style={styles.bottomNavContainer}>
      {leftTabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <TouchableOpacity key={id} style={styles.navItem} onPress={() => onSelectTab(id)}>
            <Icon size={18} color={isActive ? COLORS.primary : COLORS.textMuted} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.addBtnWrapper}>
        <TouchableOpacity style={styles.addBtn} onPress={onPressAdd} activeOpacity={0.85}>
          <Plus size={24} color={COLORS.primaryText} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navLabel}>Add</Text>
      </View>

      {rightTabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <TouchableOpacity key={id} style={styles.navItem} onPress={() => onSelectTab(id)}>
            <Icon size={18} color={isActive ? COLORS.primary : COLORS.textMuted} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// 7. 带从下往上丝滑弹出动画的记账方式选择弹窗
// 7. Ingestion Method Bottom Sheet Modal with smooth slide-up animation
export const IngestionModal = ({ visible, onClose, onSelectMethod }) => {
  const slideAnim = useRef(new Animated.Value(350)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(350);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAnimatedClose = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 350,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      if (typeof callback === "function") callback();
    });
  };

  const methods = [
    {
      id: "manual",
      label: "Manual Expense Entry",
      sub: "Enter transaction details manually",
      Icon: Pencil,
    },
    {
      id: "ocr_batch",
      label: "Screenshot Batch Import",
      sub: "Import multiple receipt images at once",
      Icon: FileText,
    },
    {
      id: "camera",
      label: "Single Receipt Camera",
      sub: "Capture one receipt with live camera",
      Icon: Camera,
    },
  ];

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={() => handleAnimatedClose()}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => handleAnimatedClose()} />

        <Animated.View style={[styles.bottomSheetCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandleWrapper}>
            <View style={styles.sheetHandle} />
          </View>

          <Text style={styles.sheetTitle}>CHOOSE INGESTION METHOD</Text>
          <Text style={styles.sheetSubtitle}>Select how you want to add a transaction</Text>

          {methods.map(({ id, label, sub, Icon }) => (
            <TouchableOpacity key={id} style={styles.methodBtn} activeOpacity={0.8} onPress={() => handleAnimatedClose(() => onSelectMethod(id))}>
              <View style={styles.methodIconBox}>
                <Icon size={16} color={COLORS.text} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{label}</Text>
                <Text style={styles.methodSub}>{sub}</Text>
              </View>
              <View style={styles.methodDot} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleAnimatedClose()}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  floatingToast: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderWidth: 2,
    borderRadius: SHAPES.inputRadius,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  toastError: {
    borderColor: COLORS.danger,
    backgroundColor: "#FFF5F5",
  },
  toastSuccess: {
    borderColor: "#15803D",
    backgroundColor: "#F0FDF4",
  },
  floatingToastText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    flex: 1,
  },
  wireBox: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.cardRadius,
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
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputBox: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 13,
    fontFamily: FONTS.mono,
    color: COLORS.text,
    padding: 0,
  },
  buttonBase: {
    width: "100%",
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFilled: {
    backgroundColor: COLORS.primary,
  },
  buttonOutline: {
    backgroundColor: "transparent",
  },
  buttonTextFilled: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontFamily: FONTS.mono,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  buttonTextOutline: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.mono,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  chipBase: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 12,
    paddingVertical: 5,
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
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chipTextActive: {
    color: COLORS.primaryText,
    fontWeight: "bold",
  },
  chipTextInactive: {
    color: COLORS.text,
  },
  headerContainer: {
    borderBottomWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavContainer: {
    borderTopWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginTop: 4,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  addBtnWrapper: {
    flex: 1,
    alignItems: "center",
    marginTop: -22,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.text,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  bottomSheetCard: {
    backgroundColor: COLORS.card,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  sheetHandleWrapper: {
    alignItems: "center",
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderMuted,
  },
  sheetTitle: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 1,
    paddingBottom: 8,
    borderBottomWidth: SHAPES.borderWidth,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  sheetSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 14,
  },
  methodBtn: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  methodIconBox: {
    width: 34,
    height: 34,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    textTransform: "uppercase",
  },
  methodSub: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  methodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  cancelBtn: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.secondary,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 1.5,
  },
});
