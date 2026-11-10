/**
 * @file frontend/src/components/shared/CalendarPicker.js
 * @layer Shared Component (Date Input UI)
 * @description Interactive monthly grid calendar that returns a valid JavaScript Date object on day selection.
 * @props {Date|string} selectedDate - Currently selected Date object or YYYY-MM-DD string
 * @props {function} onSelectDate - Callback invoked with the newly picked Date object
 * @props {function} [onClose] - Optional callback to close the parent modal after picking a date
 * @exports default CalendarPicker
 */
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../theme/colors";
import { formatDateYMD } from "../../utils/dateHelpers";
import { playUiSound } from "../../utils/soundEffects";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarPicker({ selectedDate, onSelectDate }) {
  const styles = getStyles();
  const parsedInitial = selectedDate instanceof Date ? selectedDate : selectedDate ? new Date(selectedDate) : new Date();
  const safeDate = isNaN(parsedInitial.getTime()) ? new Date() : parsedInitial;

  const [viewYear, setViewYear] = useState(safeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(safeDate.getMonth());

  useEffect(() => {
    const d = selectedDate instanceof Date ? selectedDate : selectedDate ? new Date(selectedDate) : new Date();
    if (!isNaN(d.getTime())) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [selectedDate]);

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const handlePrevMonth = () => {
    playUiSound("pop");
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    playUiSound("pop");
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedYMD = formatDateYMD(safeDate);
  const todayYMD = formatDateYMD(new Date());

  return (
    <View style={styles.calendarBox}>
      <View style={styles.calNavRow}>
        <TouchableOpacity style={styles.calNavBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={16} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.calMonthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity style={styles.calNavBtn} onPress={handleNextMonth}>
          <ChevronRight size={16} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.calWeekHeader}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.calWeekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calDaysGrid}>
        {calendarCells.map((dayNum, idx) => {
          if (!dayNum) {
            return <View key={`empty-${idx}`} style={styles.calDayCell} />;
          }
          const cellDateObj = new Date(viewYear, viewMonth, dayNum);
          const cellYMD = formatDateYMD(cellDateObj);
          const isSelected = cellYMD === selectedYMD;
          const isToday = cellYMD === todayYMD;

          return (
            <TouchableOpacity
              key={cellYMD}
              style={[styles.calDayCell, isToday && styles.calDayCellToday, isSelected && styles.calDayCellSelected]}
              onPress={() => {
                playUiSound("pop");
                if (onSelectDate) onSelectDate(cellDateObj);
              }}
            >
              <Text
                style={[
                  styles.calDayText,
                  isToday && { fontWeight: "bold", color: COLORS.primary },
                  isSelected && { color: COLORS.primaryText, fontWeight: "bold" },
                ]}
              >
                {dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    calendarBox: { width: "100%" },
    calNavRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    calNavBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    calMonthLabel: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    calWeekHeader: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 6,
    },
    calWeekDayText: {
      width: "14.28%",
      textAlign: "center",
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    calDaysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    calDayCell: {
      width: "14.28%",
      aspectRatio: 1,
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
  });

export default CalendarPicker;
