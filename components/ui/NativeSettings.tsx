import { isBelowUpstreamIOSMinimum } from '@/lib/compat/ios15';
import { layout, useAppTheme } from '@/lib/theme';
import { useIsOuterTheme } from '@/lib/theme/OuterTheme';
import {
  Button,
  Form,
  HStack,
  ProgressView,
  Section,
  Slider,
  Spacer,
  Host as SwiftHost,
  Image as SwiftImage,
  Picker as SwiftPicker,
  RNHostView as SwiftRNHostView,
  Text as SwiftText,
  TextField,
  Toggle,
  VStack,
  type TextFieldRef as SwiftTextFieldRef,
} from '@expo/ui/swift-ui';
import {
  accessibilityValue,
  autocorrectionDisabled,
  buttonStyle,
  contentShape,
  controlSize,
  createModifier,
  disabled as disabledModifier,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  lineSpacing,
  listRowSeparator,
  listSectionSpacing,
  multilineTextAlignment,
  accessibilityLabel as nativeAccessibilityLabel,
  keyboardType as nativeKeyboardType,
  opacity,
  padding,
  pickerStyle,
  scrollContentBackground,
  shapes,
  onSubmit as submitAction,
  submitLabel,
  tag,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import type { ComponentProps, ReactElement, ReactNode, Ref } from 'react';
import { Platform, Switch as RNSwitch, useWindowDimensions } from 'react-native';

import { settingsLayout } from './settingsLayout';
import { useNativeTextFieldBridge } from './useNativeTextFieldBridge';

export type NativeSettingsOption = {
  title: string;
  value: string;
  subtitle?: string;
};

export type NativeSettingsTextFieldRef = {
  setText: (newText: string) => Promise<void>;
  focus: () => Promise<void>;
  blur: () => Promise<void>;
};

export type NativeSettingsTextFieldProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url' | 'decimal-pad';
  returnKeyType?: 'default' | 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  testID?: string;
  ref?: Ref<NativeSettingsTextFieldRef>;
  trailing?: ReactNode;
  minHeight?: number;
  hideSeparator?: boolean;
};

export function NativeSettingsForm({
  children,
  testID,
  hosted = false,
  surface = 'page',
}: {
  children: ReactNode;
  testID?: string;
  hosted?: boolean;
  surface?: 'page' | 'sheet';
}) {
  const theme = useAppTheme();
  const outer = useIsOuterTheme();

  const modifiers = [
    ...(Number(Platform.Version) >= 17 ? [listSectionSpacing('compact')] : []),
    ...(Number(Platform.Version) >= 16 && (surface === 'sheet' || outer)
      ? [scrollContentBackground('hidden')]
      : []),
    createModifier('nekofinScrollEdgeEffectStyle', {}),
    tint(theme.colors.tint),
  ];

  const form = (
    <Form testID={testID} modifiers={modifiers}>
      {children}
    </Form>
  );

  if (hosted) {
    return form;
  }

  return (
    <SwiftHost
      style={{
        flex: 1,
        width: '100%',
        maxWidth: layout.formMaxWidth,
        alignSelf: 'center',
        backgroundColor: theme.colors.backgroundGrouped,
      }}
      colorScheme={theme.colorScheme}
      useViewportSizeMeasurement
    >
      {form}
    </SwiftHost>
  );
}

/** A single inset content row that keeps the original vertical settings layout. */
export function NativeSettingsColumn({
  children,
  spacing = 0,
  inset = 0,
}: {
  children: ReactNode;
  spacing?: number;
  inset?: number;
}) {
  return (
    <VStack
      alignment="leading"
      spacing={spacing}
      modifiers={[
        frame({ maxWidth: Infinity }),
        ...(inset ? [padding({ top: inset, leading: inset, bottom: inset, trailing: inset })] : []),
      ]}
    >
      {children}
    </VStack>
  );
}

/** Bridge small React Native visuals into the platform's native settings row. */
export function NativeSettingsRNHostView({
  children,
  matchContents = true,
  fillWidthHeight,
}: {
  children: ReactElement;
  matchContents?: boolean;
  /** Give a non-measuring RN host a full-width SwiftUI proposal at a fixed height. */
  fillWidthHeight?: number;
}) {
  const host = <SwiftRNHostView matchContents={matchContents}>{children}</SwiftRNHostView>;
  return fillWidthHeight ? (
    <VStack modifiers={[frame({ maxWidth: Infinity, height: fillWidthHeight })]}>{host}</VStack>
  ) : (
    host
  );
}

export function NativeSettingsSection({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <Section title={title} footer={footer}>
      {children}
    </Section>
  );
}

function NativeDisclosureIndicator() {
  const theme = useAppTheme();

  return (
    <SwiftImage
      systemName="chevron.right"
      size={15}
      color={theme.colors.textTertiary}
      modifiers={[frame({ width: 18, height: 18 })]}
    />
  );
}

function SettingsLabel({
  title,
  subtitle,
  leading,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <HStack spacing={12}>
      {leading ? (
        <SwiftRNHostView matchContents>
          <>{leading}</>
        </SwiftRNHostView>
      ) : null}
      <VStack alignment="leading" spacing={3}>
        {typeof title === 'string' ? <SwiftText>{title}</SwiftText> : title}
        {typeof subtitle === 'string' ? <SwiftText>{subtitle}</SwiftText> : subtitle}
      </VStack>
    </HStack>
  );
}

export function NativeSettingsButton({
  label,
  onPress,
  destructive,
  accessibilityLabel,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      label={label}
      role={destructive ? 'destructive' : 'default'}
      onPress={onPress}
      modifiers={[
        buttonStyle('borderless'),
        frame({ minHeight: 44 }),
        disabledModifier(disabled),
        ...(accessibilityLabel ? [nativeAccessibilityLabel(accessibilityLabel)] : []),
      ]}
    />
  );
}

export function NativeSettingsItem({
  title,
  subtitle,
  leading,
  value,
  trailing,
  disclosure = false,
  onPress,
  testID,
  modifiers,
  disabled = false,
  busy = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  value?: string;
  /** Native SwiftUI/Compose content, without a React Native host wrapper. */
  trailing?: ReactNode;
  disclosure?: boolean;
  onPress?: () => void;
  testID?: string;
  modifiers?: NonNullable<ComponentProps<typeof SwiftText>['modifiers']>;
  /** Android Compose viewport observer used by the SDK55 compatibility adapter. */
  onPositionChange?: (position: { x: number; y: number; width: number; height: number }) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const inactive = disabled || busy;
  const row = (
    <HStack
      spacing={12}
      modifiers={[
        frame({ maxWidth: Infinity, minHeight: 28, alignment: 'leading' }),
        contentShape(shapes.rectangle()),
      ]}
    >
      <SettingsLabel title={title} subtitle={subtitle} leading={leading} />
      <Spacer />
      {busy ? (
        <ProgressView
          modifiers={[controlSize('small'), createModifier('nekofinAccessibilityHidden', {})]}
        />
      ) : trailing ? (
        trailing
      ) : disclosure ? (
        <NativeDisclosureIndicator />
      ) : value ? (
        <SwiftText>{value}</SwiftText>
      ) : null}
    </HStack>
  );
  const rowModifiers = [
    disabledModifier(inactive),
    ...(inactive ? [opacity(0.45)] : []),
    ...(modifiers ?? []),
  ];
  return onPress ? (
    <Button onPress={onPress} testID={testID} modifiers={[buttonStyle('plain'), ...rowModifiers]}>
      {row}
    </Button>
  ) : (
    <VStack testID={testID} alignment="leading" modifiers={rowModifiers}>
      {row}
    </VStack>
  );
}

/** A settings input row with platform sizing and alignment, for use inside NativeSettingsSection. */
export function NativeSettingsTextField({
  label,
  value,
  defaultValue,
  onChangeText,
  placeholder,
  editable = true,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  testID,
  ref,
  trailing,
  minHeight = settingsLayout.inputMinHeight,
  hideSeparator = false,
}: NativeSettingsTextFieldProps) {
  const { initialValue, nativeRef, onNativeValueChange } = useNativeTextFieldBridge({
    value,
    defaultValue,
    onChangeText,
    forwardedRef: ref,
  });
  const modifiers = [
    frame({ maxWidth: Infinity, minHeight }),
    nativeAccessibilityLabel(label),
    ...(editable ? [] : [disabledModifier(true)]),
    ...(autoCapitalize
      ? [textInputAutocapitalization(autoCapitalize === 'none' ? 'never' : autoCapitalize)]
      : []),
    ...(autoCorrect === false ? [autocorrectionDisabled(true)] : []),
    ...(keyboardType ? [nativeKeyboardType(keyboardType)] : []),
    ...(returnKeyType && returnKeyType !== 'default' ? [submitLabel(returnKeyType)] : []),
    ...(onSubmitEditing ? [submitAction(onSubmitEditing)] : []),
  ];
  return (
    <NativeSettingsItem
      title={
        <TextField
          ref={nativeRef as Ref<SwiftTextFieldRef>}
          defaultValue={initialValue}
          onValueChange={onNativeValueChange}
          placeholder={placeholder}
          testID={testID}
          modifiers={modifiers}
        />
      }
      trailing={trailing}
      modifiers={hideSeparator ? [listRowSeparator('hidden', 'all')] : undefined}
    />
  );
}

export function NativeSettingsSwitch({
  title,
  subtitle,
  leading,
  value,
  onValueChange,
  disabled,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const supportsNativeToggle =
    Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 18;

  // Keep the RN Switch fallback on iOS 15–17; use SwiftUI Toggle from iOS 18.
  if (!supportsNativeToggle) {
    return (
      <HStack
        spacing={12}
        modifiers={[
          frame({ maxWidth: Infinity, minHeight: 44 }),
          disabledModifier(!!disabled),
          ...(disabled ? [opacity(0.45)] : []),
        ]}
      >
        <Button
          onPress={() => onValueChange(!value)}
          modifiers={[
            buttonStyle('plain'),
            frame({ maxWidth: Infinity, minHeight: 44, alignment: 'leading' }),
            contentShape(shapes.rectangle()),
          ]}
        >
          <SettingsLabel title={title} subtitle={subtitle} leading={leading} />
        </Button>
        <NativeSettingsRNHostView>
          <RNSwitch
            value={value}
            onValueChange={onValueChange}
            disabled={!!disabled}
            trackColor={{ false: theme.colors.separator, true: theme.colors.tint }}
          />
        </NativeSettingsRNHostView>
      </HStack>
    );
  }

  return (
    <Toggle
      isOn={value}
      onIsOnChange={onValueChange}
      modifiers={[disabledModifier(!!disabled), ...(disabled ? [opacity(0.45)] : [])]}
    >
      <SettingsLabel title={title} subtitle={subtitle} leading={leading} />
    </Toggle>
  );
}

export function NativeSettingsPicker({
  title,
  subtitle,
  leading,
  value,
  options,
  onValueChange,
  disabled,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  value: string;
  options: NativeSettingsOption[];
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();

  // The upstream menu-style picker works on its supported iOS 16.4+ range.
  // Keep the separate-label workaround exclusively for unsupported old iOS.
  if (!isBelowUpstreamIOSMinimum(Platform.OS, Platform.Version)) {
    return (
      <SwiftPicker
        label={<SettingsLabel title={title} subtitle={subtitle} leading={leading} />}
        selection={value}
        onSelectionChange={(next) => onValueChange?.(String(next))}
        modifiers={[
          pickerStyle('menu'),
          frame({ minHeight: 28 }),
          tint(theme.colors.tint),
          disabledModifier(!!disabled),
          ...(disabled ? [opacity(0.45)] : []),
        ]}
      >
        {options.map((option) => (
          <SwiftText key={option.value} modifiers={[tag(option.value)]}>
            {option.title}
          </SwiftText>
        ))}
      </SwiftPicker>
    );
  }

  // On iOS 15, a menu-style SwiftUI Picker can omit its label entirely in a
  // Form row. Render a separate left-side label and a trailing, label-hidden
  // selector instead; the displayed selection is only the selected option.
  return (
    <HStack
      spacing={12}
      modifiers={[
        frame({ maxWidth: Infinity, minHeight: 44 }),
        disabledModifier(!!disabled),
        ...(disabled ? [opacity(0.45)] : []),
      ]}
    >
      <SettingsLabel title={title} subtitle={subtitle} leading={leading} />
      <Spacer />
      <SwiftPicker
        label={typeof title === 'string' ? title : ''}
        selection={value}
        onSelectionChange={(next) => onValueChange?.(String(next))}
        modifiers={[pickerStyle('menu'), labelsHidden(), tint(theme.colors.tint)]}
      >
        {options.map((option) => (
          <SwiftText key={option.value} modifiers={[tag(option.value)]}>
            {option.title}
          </SwiftText>
        ))}
      </SwiftPicker>
    </HStack>
  );
}

export function NativeSettingsChoiceList({
  label,
  value,
  options,
  onValueChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: NativeSettingsOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <SwiftPicker
      label={label}
      selection={value}
      onSelectionChange={(next) => onValueChange(String(next))}
      modifiers={[
        pickerStyle('inline'),
        labelsHidden(),
        tint(theme.colors.tint),
        disabledModifier(disabled),
        ...(disabled ? [opacity(0.45)] : []),
      ]}
    >
      {options.map((option) => (
        <VStack key={option.value} alignment="leading" modifiers={[tag(option.value)]}>
          <SwiftText>{option.title}</SwiftText>
          {option.subtitle ? (
            <SwiftText
              modifiers={[
                createModifier('nekofinFontTextStyle', { textStyle: 'footnote' }),
                foregroundStyle(theme.colors.textSecondary),
              ]}
            >
              {option.subtitle}
            </SwiftText>
          ) : null}
        </VStack>
      ))}
    </SwiftPicker>
  );
}

export function NativeSettingsSlider({
  title,
  subtitle,
  leading,
  value,
  min,
  max,
  step,
  onValueChange,
  formatValue,
  disabled,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const displayValue = formatValue ? formatValue(value) : String(value);
  const { fontScale } = useWindowDimensions();

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[disabledModifier(!!disabled), ...(disabled ? [opacity(0.45)] : [])]}
    >
      {fontScale > 1.3 ? (
        <VStack
          alignment="leading"
          spacing={4}
          modifiers={[createModifier('nekofinAccessibilityHidden', {})]}
        >
          <SettingsLabel title={title} leading={leading} />
          <SwiftText>{displayValue}</SwiftText>
        </VStack>
      ) : (
        <HStack spacing={12} modifiers={[createModifier('nekofinAccessibilityHidden', {})]}>
          <SettingsLabel title={title} leading={leading} />
          <Spacer />
          <SwiftText>{displayValue}</SwiftText>
        </HStack>
      )}
      {subtitle}
      <Slider
        label={title}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={onValueChange}
        modifiers={[tint(theme.colors.tint), accessibilityValue(displayValue)]}
      />
    </VStack>
  );
}

export function NativeSettingsText({
  children,
  color,
  fontSize = 16,
  fontWeight = 'regular',
  textStyle,
  maxLines,
  lineHeight,
  textAlign,
}: {
  children: ReactNode;
  color?: string;
  fontSize?: number;
  fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
  textStyle?: 'largeTitle' | 'title' | 'title3' | 'headline' | 'subheadline' | 'body' | 'footnote';
  maxLines?: number;
  lineHeight?: number;
  textAlign?: 'leading' | 'center' | 'trailing';
}) {
  return (
    <SwiftText
      modifiers={[
        textStyle
          ? createModifier('nekofinFontTextStyle', { textStyle, weight: fontWeight })
          : font({ size: fontSize, weight: fontWeight }),
        ...(lineHeight ? [lineSpacing(Math.max(0, lineHeight - fontSize * 1.2))] : []),
        ...(!maxLines ? [fixedSize({ horizontal: false, vertical: true })] : []),
        ...(maxLines ? [lineLimit(maxLines)] : []),
        ...(color ? [foregroundStyle(color)] : []),
        ...(textAlign ? [multilineTextAlignment(textAlign)] : []),
      ]}
    >
      {children}
    </SwiftText>
  );
}
