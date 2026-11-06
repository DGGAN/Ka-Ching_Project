// Import React hooks, core React Native UI primitives, Image, Animated API, and Lucide icons
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Modal, Animated, Platform, StyleSheet } from "react-native";
import {
  Bell,
  User,
  ArrowLeft,
  Home,
  Clock,
  Plus,
  PieChart,
  Sparkles,
  Edit3,
  Camera,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../theme/theme";

// 1. Shared Helper: Safely convert any Date or string into "YYYY-MM-DD"
export const formatDateYMD = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// 2. Shared Helper: Generate the past 6 months in chronological order (oldest -> current month)
export const getSixMonthWindow = () => {
  const list = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortMonth = d.toLocaleDateString("en-US", { month: "short" });
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    list.push({
      key,
      shortMonth,
      label,
      year: d.getFullYear(),
      month: d.getMonth(),
      monthNum: d.getMonth() + 1,
      isCurrentMonth: i === 0,
    });
  }
  return list;
};

// 3. Shared Helper: Distinct Web Audio Synthesizer for Coin "Ka-Ching!", Doorbell Notification & Tab Clicks
export const playUiSound = (type = "tab") => {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "kaching") {
        // Metallic 4-Coin Cascade + Cash Register Drawer sound for Create Transaction
        const drawerOsc = ctx.createOscillator();
        const drawerGain = ctx.createGain();
        drawerOsc.type = "sawtooth";
        drawerOsc.frequency.setValueAtTime(140, now);
        drawerOsc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
        drawerGain.gain.setValueAtTime(0.08, now);
        drawerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        drawerOsc.connect(drawerGain);
        drawerGain.connect(ctx.destination);
        drawerOsc.start(now);
        drawerOsc.stop(now + 0.055);

        // 4 Rapid Metallic Coin Clinks (High-pitched shimmering coin frequencies)
        const coinNotes = [
          { freq: 1318.51, delay: 0.05, dur: 0.14 },
          { freq: 1760.0, delay: 0.11, dur: 0.16 },
          { freq: 2093.0, delay: 0.17, dur: 0.18 },
          { freq: 2637.02, delay: 0.24, dur: 0.45 },
        ];

        coinNotes.forEach((c) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g = ctx.createGain();

          osc1.type = "sine";
          osc2.type = "triangle";
          osc1.frequency.setValueAtTime(c.freq, now + c.delay);
          // Metallic inharmonic overtone for realistic coin ring
          osc2.frequency.setValueAtTime(c.freq * 2.41, now + c.delay);

          g.gain.setValueAtTime(0.0001, now);
          g.gain.setValueAtTime(0.14, now + c.delay);
          g.gain.exponentialRampToValueAtTime(0.0008, now + c.delay + c.dur);

          osc1.connect(g);
          osc2.connect(g);
          g.connect(ctx.destination);

          osc1.start(now + c.delay);
          osc1.stop(now + c.delay + c.dur + 0.02);
          osc2.start(now + c.delay);
          osc2.stop(now + c.delay + c.dur + 0.02);
        });
      } else if (type === "bell") {
        // Warm Downward "Ding-Dong" Chime for Notification Bell (A5 880Hz -> D5 587.33Hz)
        const ding = ctx.createOscillator();
        const dingGain = ctx.createGain();
        ding.type = "sine";
        ding.frequency.setValueAtTime(880, now);
        dingGain.gain.setValueAtTime(0.12, now);
        dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        ding.connect(dingGain);
        dingGain.connect(ctx.destination);
        ding.start(now);
        ding.stop(now + 0.23);

        const dong = ctx.createOscillator();
        const dongGain = ctx.createGain();
        dong.type = "sine";
        dong.frequency.setValueAtTime(587.33, now + 0.14);
        dongGain.gain.setValueAtTime(0.0001, now);
        dongGain.gain.setValueAtTime(0.14, now + 0.14);
        dongGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        dong.connect(dongGain);
        dongGain.connect(ctx.destination);
        dong.start(now + 0.14);
        dong.stop(now + 0.5);
      } else if (type === "success") {
        // Soft 2-note chord for general settings/budget save
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.07);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.23);
      } else {
        // Subtle single low woodblock tap for screen/tab navigation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.04);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    }
  } catch (e) {
    // Ignore audio context restrictions if user has not interacted yet
  }
};

// 4. Top Header Navigation Bar with kaching_logo.png, Back Button, Bell Icon, and Profile Icon
export const TopHeader = ({ title, showBack = false, onBackPress, onBellPress, onProfilePress }) => {
  const styles = getStyles();
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => {
              playUiSound("tab");
              if (onBackPress) onBackPress();
            }}
            activeOpacity={0.75}
          >
            <ArrowLeft size={16} color={COLORS.text} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <Image source={require("../../assets/kaching_logo.png")} style={styles.logoImage} resizeMode="contain" />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => {
            playUiSound("bell");
            if (onBellPress) onBellPress();
          }}
          activeOpacity={0.75}
        >
          <Bell size={16} color={COLORS.text} strokeWidth={2.3} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconCircleBtn}
          onPress={() => {
            playUiSound("tab");
            if (onProfilePress) onProfilePress();
          }}
          activeOpacity={0.75}
        >
          <User size={16} color={COLORS.text} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 5. Bottom 5-Tab Navigation Bar with Elevated Center "+" Action Button
export const BottomNav = ({ activeTab, onSelectTab, onPressAdd }) => {
  const styles = getStyles();
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "transactions", label: "History", icon: Clock },
    { id: "center_add", label: "Add", isAddButton: true },
    { id: "budget", label: "Budget", icon: PieChart },
    { id: "insights", label: "Insights", icon: Sparkles },
  ];

  return (
    <View style={styles.bottomNavContainer}>
      {navItems.map((item) => {
        if (item.isAddButton) {
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.centerAddButton}
              activeOpacity={0.85}
              onPress={() => {
                playUiSound("tab");
                if (onPressAdd) onPressAdd();
              }}
            >
              <Plus size={22} color={COLORS.primaryText} strokeWidth={3} />
            </TouchableOpacity>
          );
        }

        const IconComponent = item.icon;
        const isActive = activeTab === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navTabItem}
            activeOpacity={0.75}
            onPress={() => {
              playUiSound("tab");
              if (onSelectTab) onSelectTab(item.id);
            }}
          >
            <IconComponent size={18} color={isActive ? COLORS.primary : COLORS.textMuted} strokeWidth={isActive ? 2.6 : 2} />
            <Text style={[styles.navTabLabel, isActive && { color: COLORS.primary, fontWeight: "bold" }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// 6. Ingestion Method Selection Modal ("+" Button Popup: Manual Entry vs Single/Batch OCR)
export const IngestionModal = ({ visible, onClose, onSelectMethod }) => {
  const styles = getStyles();
  const methods = [
    {
      id: "manual",
      title: "Manual Entry",
      subtitle: "Type amount, merchant & category manually",
      icon: Edit3,
    },
    {
      id: "ocr_single",
      title: "Scan Single Receipt (AI OCR)",
      subtitle: "Extract merchant, date & total from 1 receipt photo",
      icon: Camera,
    },
    {
      id: "ocr_batch",
      title: "Batch Scan Up to 5 Receipts",
      subtitle: "Queue multiple receipts and verify them side-by-side",
      icon: Layers,
    },
  ];

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalHeaderTitle}>ADD TRANSACTION</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubText}>Choose how you would like to record your income or expense:</Text>

          {methods.map((m) => {
            const Icon = m.icon;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.methodOptionCard}
                activeOpacity={0.8}
                onPress={() => {
                  playUiSound("tab");
                  onClose();
                  if (onSelectMethod) onSelectMethod(m.id);
                }}
              >
                <View style={styles.methodIconCircle}>
                  <Icon size={17} color={COLORS.primary} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{m.title}</Text>
                  <Text style={styles.methodSubtitle}>{m.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

// 7. Inline CalendarPicker Component (Used directly inside TransactionsScreen edit modal & wrapped by CalendarModal)
export const CalendarPicker = ({ selectedDate, onSelectDate, onClose }) => {
  const styles = getStyles();
  const initialDate = selectedDate instanceof Date ? selectedDate : selectedDate ? new Date(selectedDate) : new Date();
  const safeInit = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState(safeInit.getFullYear());
  const [viewMonth, setViewMonth] = useState(safeInit.getMonth());

  useEffect(() => {
    if (selectedDate) {
      const parsed = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      if (!isNaN(parsed.getTime())) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [selectedDate]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    playUiSound("tab");
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    playUiSound("tab");
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const dayCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells.push(d);
  }

  const selectedYMD = formatDateYMD(safeInit);
  const todayYMD = formatDateYMD(new Date());

  return (
    <View style={styles.inlineCalendarBox}>
      {/* Month & Year Navigation Bar */}
      <View style={styles.calNavRow}>
        <TouchableOpacity style={styles.calNavBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={16} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.calMonthTitle}>{monthLabel}</Text>
        <TouchableOpacity style={styles.calNavBtn} onPress={handleNextMonth}>
          <ChevronRight size={16} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.calWeekRow}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
          <Text key={w} style={styles.calWeekText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Calendar Day Grid */}
      <View style={styles.calGrid}>
        {dayCells.map((dayNum, idx) => {
          if (!dayNum) {
            return <View key={`empty_${idx}`} style={styles.calDayCell} />;
          }
          const cellYMD = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const isSelected = cellYMD === selectedYMD;
          const isToday = cellYMD === todayYMD;

          return (
            <TouchableOpacity
              key={cellYMD}
              style={[styles.calDayCell, isToday && styles.calDayCellToday, isSelected && styles.calDayCellSelected]}
              onPress={() => {
                playUiSound("tab");
                // Always pass back a real Date object so .toLocaleDateString() never crashes!
                const pickedDateObj = new Date(viewYear, viewMonth, dayNum, 12, 0, 0);
                if (onSelectDate) onSelectDate(pickedDateObj);
                if (onClose) onClose();
              }}
            >
              <Text
                style={[
                  styles.calDayText,
                  isToday && { fontWeight: "bold", color: COLORS.primary },
                  isSelected && {
                    color: COLORS.primaryText,
                    fontWeight: "bold",
                  },
                ]}
              >
                {dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick "Today" Shortcut & Close Button */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <WireButton
          label="TODAY"
          variant="outline"
          style={{ flex: 1, paddingVertical: 8 }}
          onPress={() => {
            playUiSound("tab");
            const nowObj = new Date();
            if (onSelectDate) onSelectDate(nowObj);
            if (onClose) onClose();
          }}
        />
        {onClose && <WireButton label="CLOSE" style={{ flex: 1, paddingVertical: 8 }} onPress={onClose} />}
      </View>
    </View>
  );
};

// 8. Popup CalendarModal Component (Used in AddTransactionScreen & OCRScannerScreen)
export const CalendarModal = ({ visible, selectedDate, onSelectDate, onClose }) => {
  const styles = getStyles();
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CalendarIcon size={15} color={COLORS.primary} strokeWidth={2.5} />
              <Text style={styles.modalHeaderTitle}>SELECT DATE</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <CalendarPicker selectedDate={selectedDate} onSelectDate={onSelectDate} onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
};

// 9. Standard Wireframe Card Container Component
export const WireBox = ({ children, style }) => {
  const styles = getStyles();
  return <View style={[styles.wireBox, style]}>{children}</View>;
};

// 10. Standard Labeled Text Input Component
export const WireInput = ({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = "default", style }) => {
  const styles = getStyles();
  return (
    <View style={[styles.inputWrapper, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );
};

// 11. Standard Brutalist/Pastel Button Component
export const WireButton = ({ label, onPress, variant = "filled", style, disabled = false }) => {
  const styles = getStyles();
  const isFilled = variant === "filled";
  return (
    <TouchableOpacity
      style={[styles.wireButton, isFilled ? styles.wireButtonFilled : styles.wireButtonOutline, disabled && { opacity: 0.5 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.wireButtonText, isFilled ? styles.wireButtonTextFilled : styles.wireButtonTextOutline]}>{label}</Text>
    </TouchableOpacity>
  );
};

// 12. Selectable Filter Pill Chip Component
export const WireChip = ({ label, active = false, onPress }) => {
  const styles = getStyles();
  return (
    <TouchableOpacity
      style={[styles.wireChip, active && styles.wireChipActive]}
      onPress={() => {
        playUiSound("tab");
        if (onPress) onPress();
      }}
      activeOpacity={0.75}
    >
      <Text style={[styles.wireChipText, active && styles.wireChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

// 13. Custom Hook & Banner for Non-Blocking Top Floating Toast Alerts
export const useFloatingToast = () => {
  const [toast, setToast] = useState(null);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef(null);

  const showToast = (type, message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });

    Animated.spring(slideAnim, {
      toValue: 12,
      useNativeDriver: Platform.OS !== "web",
      speed: 18,
      bounciness: 6,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -90,
        duration: 220,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => setToast(null));
    }, 3000);
  };

  return { toast, slideAnim, showToast };
};

export const FloatingToast = ({ toast, slideAnim }) => {
  const styles = getStyles();
  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <Animated.View
      style={[styles.toastBanner, isError ? styles.toastBannerError : styles.toastBannerSuccess, { transform: [{ translateY: slideAnim }] }]}
    >
      {isError ? <AlertTriangle size={15} color="#E11D48" strokeWidth={2.5} /> : <CheckCircle2 size={15} color="#15803D" strokeWidth={2.5} />}
      <Text style={[styles.toastText, { color: isError ? "#9F1239" : "#14532D" }]}>{toast.message}</Text>
    </Animated.View>
  );
};

// 14. Dynamic Style Generator reading live COLORS and SHAPES on every render
const getStyles = () =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: COLORS.card,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    logoImage: {
      width: 34,
      height: 34,
      borderRadius: 8,
    },
    headerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 15,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.6,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconCircleBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    bottomNavContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      backgroundColor: COLORS.card,
      borderTopWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    navTabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
    },
    navTabLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 3,
    },
    centerAddButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 8,
      shadowColor: COLORS.text,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 0,
      elevation: 4,
    },
    wireBox: {
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 14,
      shadowColor: COLORS.text,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 0,
      elevation: 2,
    },
    inputWrapper: {
      marginBottom: 12,
    },
    inputLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 5,
      letterSpacing: 0.5,
    },
    textInput: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.text,
    },
    wireButton: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    wireButtonFilled: {
      backgroundColor: COLORS.primary,
    },
    wireButtonOutline: {
      backgroundColor: COLORS.card,
    },
    wireButtonText: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      letterSpacing: 0.8,
    },
    wireButtonTextFilled: {
      color: COLORS.primaryText,
    },
    wireButtonTextOutline: {
      color: COLORS.text,
    },
    wireChip: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
    },
    wireChipActive: {
      backgroundColor: COLORS.primary,
    },
    wireChipText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    wireChipTextActive: {
      color: COLORS.primaryText,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalSheet: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    modalHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 10,
    },
    modalHeaderTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    modalSubText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginBottom: 12,
      lineHeight: 13,
    },
    methodOptionCard: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 12,
      marginBottom: 10,
      gap: 12,
    },
    methodIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
      alignItems: "center",
      justifyContent: "center",
    },
    methodTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    methodSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    inlineCalendarBox: {
      marginTop: 4,
    },
    calNavRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    calNavBtn: {
      width: 30,
      height: 30,
      borderRadius: SHAPES.inputRadius,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    calMonthTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    calWeekRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 6,
    },
    calWeekText: {
      width: "14.28%",
      textAlign: "center",
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    calGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    calDayCell: {
      width: "14.28%",
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    calDayCellToday: {
      borderWidth: 1.5,
      borderColor: COLORS.primary,
    },
    calDayCellSelected: {
      backgroundColor: COLORS.primary,
    },
    calDayText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.text,
    },
    toastBanner: {
      position: "absolute",
      top: 0,
      left: 16,
      right: 16,
      zIndex: 9999,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1.5,
      borderRadius: SHAPES.inputRadius,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: "#121212",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 6,
    },
    toastBannerSuccess: {
      backgroundColor: "#DCFCE7",
      borderColor: "#15803D",
    },
    toastBannerError: {
      backgroundColor: "#FFE4E6",
      borderColor: "#E11D48",
    },
    toastText: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
    },
  });
