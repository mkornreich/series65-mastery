import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, PanResponder } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors, spacing, radius, font } from '../theme/theme';

// A basic pop-up calculator, like the on-screen one provided in the real Series 65
// exam: four functions plus square root and percent. Draggable so it can be moved
// off the question, and dismissible.

type Op = '+' | '−' | '×' | '÷';

function apply(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

function fmt(n: number): string {
  if (!isFinite(n)) return 'Error';
  // Trim floating-point noise without forcing scientific notation for normal magnitudes.
  const rounded = Number(n.toPrecision(12));
  return String(rounded);
}

export function CalculatorModal({
  visible,
  onClose,
  resetKey,
}: {
  visible: boolean;
  onClose: () => void;
  /** Change this (e.g. per question id) to clear the calculator automatically. */
  resetKey?: string | number;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [display, setDisplay] = useState('0');
  const accRef = useRef<number | null>(null);
  const opRef = useRef<Op | null>(null);
  const waitRef = useRef(false); // next digit starts a new operand
  const errRef = useRef(false);

  const reset = () => {
    setDisplay('0');
    accRef.current = null;
    opRef.current = null;
    waitRef.current = false;
    errRef.current = false;
  };

  // Clear the calculator on every new question (like the real exam calculator,
  // which does not carry a running total from one question to the next). The
  // dragged position is intentionally preserved so the user needn't re-move it.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const inputDigit = (d: string) => {
    if (errRef.current) reset();
    if (waitRef.current) {
      setDisplay(d);
      waitRef.current = false;
    } else {
      setDisplay((cur) => (cur === '0' ? d : cur.length < 12 ? cur + d : cur));
    }
  };

  const inputDot = () => {
    if (errRef.current) reset();
    if (waitRef.current) {
      setDisplay('0.');
      waitRef.current = false;
    } else {
      setDisplay((cur) => (cur.includes('.') ? cur : cur + '.'));
    }
  };

  const chooseOp = (op: Op) => {
    if (errRef.current) return;
    const cur = parseFloat(display);
    if (opRef.current != null && !waitRef.current && accRef.current != null) {
      const r = apply(accRef.current, opRef.current, cur);
      accRef.current = r;
      setDisplay(fmt(r));
      if (!isFinite(r)) errRef.current = true;
    } else {
      accRef.current = cur;
    }
    opRef.current = op;
    waitRef.current = true;
  };

  const equals = () => {
    if (opRef.current == null || accRef.current == null) return;
    const cur = parseFloat(display);
    const r = apply(accRef.current, opRef.current, cur);
    setDisplay(fmt(r));
    if (!isFinite(r)) errRef.current = true;
    accRef.current = null;
    opRef.current = null;
    waitRef.current = true;
  };

  const unary = (fn: (x: number) => number) => {
    if (errRef.current) return;
    const r = fn(parseFloat(display));
    setDisplay(fmt(r));
    errRef.current = !isFinite(r);
    waitRef.current = true;
  };

  const backspace = () => {
    if (errRef.current) {
      reset();
      return;
    }
    if (waitRef.current) return;
    setDisplay((c) => (c.length > 1 ? c.slice(0, -1) : '0'));
  };

  // Drag handling. Grab the responder as soon as the handle is touched, and drive
  // the position by writing the animated value directly on each move — binding
  // Animated.event straight to pan.x/pan.y did not update under the New Architecture.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: (_e, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const Key = ({ label, onPress, kind }: { label: string; onPress: () => void; kind?: 'op' | 'fn' | 'eq' }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        kind === 'op' && styles.keyOp,
        kind === 'fn' && styles.keyFn,
        kind === 'eq' && styles.keyEq,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.keyText, (kind === 'op' || kind === 'eq') && { color: colors.onBright }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.panel, { transform: pan.getTranslateTransform() }]}>
        {/* The drag zone and the close button are SIBLINGS: the pan responder
            (which grabs on touch-start) covers only the grip + title, so a tap on
            ✕ is never swallowed by the drag and always closes the calculator. */}
        <View style={styles.header}>
          <View style={styles.dragZone} {...panResponder.panHandlers}>
            <View style={styles.gripBar} />
            <Text style={styles.handleText}>Calculator · drag to move</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={24} style={styles.closeBtn}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.displayWrap}>
          <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
            {display}
          </Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.row}>
            <Key label="C" kind="fn" onPress={reset} />
            <Key label="⌫" kind="fn" onPress={backspace} />
            <Key label="√" kind="fn" onPress={() => unary(Math.sqrt)} />
            <Key label="÷" kind="op" onPress={() => chooseOp('÷')} />
          </View>
          <View style={styles.row}>
            <Key label="7" onPress={() => inputDigit('7')} />
            <Key label="8" onPress={() => inputDigit('8')} />
            <Key label="9" onPress={() => inputDigit('9')} />
            <Key label="×" kind="op" onPress={() => chooseOp('×')} />
          </View>
          <View style={styles.row}>
            <Key label="4" onPress={() => inputDigit('4')} />
            <Key label="5" onPress={() => inputDigit('5')} />
            <Key label="6" onPress={() => inputDigit('6')} />
            <Key label="−" kind="op" onPress={() => chooseOp('−')} />
          </View>
          <View style={styles.row}>
            <Key label="1" onPress={() => inputDigit('1')} />
            <Key label="2" onPress={() => inputDigit('2')} />
            <Key label="3" onPress={() => inputDigit('3')} />
            <Key label="+" kind="op" onPress={() => chooseOp('+')} />
          </View>
          <View style={styles.row}>
            <Key label="%" kind="fn" onPress={() => unary((x) => x / 100)} />
            <Key label="0" onPress={() => inputDigit('0')} />
            <Key label="." onPress={inputDot} />
            <Key label="=" kind="eq" onPress={equals} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
    panel: {
      position: 'absolute',
      alignSelf: 'center',
      top: '18%',
      width: 300,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.xs,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    dragZone: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 2,
    },
    gripBar: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: spacing.sm,
    },
    handleText: { color: colors.textMuted, fontSize: font.small, fontWeight: '800', letterSpacing: 0.5 },
    closeBtn: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      marginLeft: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    close: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
    displayWrap: {
      backgroundColor: colors.bgAlt,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
      minHeight: 56,
      justifyContent: 'center',
    },
    display: { color: colors.text, fontSize: font.h1, fontWeight: '700', textAlign: 'right' },
    grid: {},
    row: { flexDirection: 'row' },
    key: {
      flex: 1,
      aspectRatio: 1.25,
      margin: 3,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyOp: { backgroundColor: colors.primary },
    keyEq: { backgroundColor: colors.accent },
    keyFn: { backgroundColor: colors.bgAlt },
    keyText: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  });
