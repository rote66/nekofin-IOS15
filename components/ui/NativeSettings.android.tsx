import { useFloatingTabBarInset } from '@/components/navigation/FloatingTabBarInset';
import { useTranslation } from '@/lib/i18n';
import { layout, useAppTheme } from '@/lib/theme';
import {
  AlertDialog,
  Box,
  CircularProgressIndicator,
  Column,
  RNHostView as ComposeRNHostView,
  TextField as ComposeTextField,
  Host,
  LazyColumn,
  ListItem,
  RadioButton,
  Row,
  Slider,
  Switch,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  alpha,
  background,
  clickable,
  fillMaxSize,
  fillMaxWidth,
  height,
  testID as nativeTestID,
  padding,
  selectable,
  selectableGroup,
  size,
  weight,
  wrapContentHeight,
} from '@expo/ui/jetpack-compose/modifiers';
import { useState, type ComponentProps, type ReactElement } from 'react';
import { useWindowDimensions } from 'react-native';

import { composeOnGloballyPositioned, composeSemantics } from './composeCompatModifiers.android';
import type * as SharedSettings from './NativeSettings';
import { NativeSettingsGroup, NativeSettingsRows } from './NativeSettingsGroup.android';
import { settingsLayout } from './settingsLayout';
import { useNativeTextFieldBridge } from './useNativeTextFieldBridge';

export type { NativeSettingsOption, NativeSettingsTextFieldProps } from './NativeSettings';

// Keep Android preferences separate from the SwiftUI form used on iOS.
export function NativeSettingsForm({
  children,
  testID,
  hosted = false,
  surface = 'page',
}: ComponentProps<typeof SharedSettings.NativeSettingsForm>) {
  const theme = useAppTheme();
  const tabBarInset = useFloatingTabBarInset();
  const form = (
    <LazyColumn
      contentPadding={{ top: 8, bottom: surface === 'sheet' ? 24 : Math.max(24, tabBarInset) }}
      modifiers={[
        fillMaxSize(),
        background(theme.colors.backgroundGrouped),
        ...(testID ? [nativeTestID(testID)] : []),
      ]}
    >
      {children}
    </LazyColumn>
  );
  return hosted ? (
    form
  ) : (
    <Host
      style={{ flex: 1, width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center' }}
      colorScheme={theme.colorScheme}
      useViewportSizeMeasurement
    >
      {form}
    </Host>
  );
}

/** A single inset content row that keeps the original vertical settings layout. */
export function NativeSettingsColumn({
  children,
  spacing = 0,
  inset = 0,
}: {
  children: React.ReactNode;
  spacing?: number;
  inset?: number;
}) {
  return (
    <Column
      verticalArrangement={spacing ? { spacedBy: spacing } : undefined}
      modifiers={[fillMaxWidth(), ...(inset ? [padding(inset, inset, inset, inset)] : [])]}
    >
      {children}
    </Column>
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
  fillWidthHeight?: number;
}) {
  const host = <ComposeRNHostView matchContents={matchContents}>{children}</ComposeRNHostView>;
  return fillWidthHeight ? (
    <Box modifiers={[fillMaxWidth(), height(fillWidthHeight)]}>{host}</Box>
  ) : (
    host
  );
}

export function NativeSettingsSection({
  title,
  footer,
  children,
}: ComponentProps<typeof SharedSettings.NativeSettingsSection>) {
  const theme = useAppTheme();
  return (
    <Column
      modifiers={[
        fillMaxWidth(),
        padding(
          settingsLayout.contentInset,
          settingsLayout.sectionSpacing,
          settingsLayout.contentInset,
          settingsLayout.sectionSpacing,
        ),
      ]}
    >
      {title ? (
        <Text
          color={theme.colors.tint}
          style={{ typography: 'labelLarge' }}
          modifiers={[padding(settingsLayout.contentInset, 0, settingsLayout.contentInset, 8)]}
        >
          {title}
        </Text>
      ) : null}
      <NativeSettingsGroup>{children}</NativeSettingsGroup>
      {footer ? (
        <Text
          color={theme.colors.textSecondary}
          style={{ typography: 'bodySmall' }}
          modifiers={[padding(settingsLayout.contentInset, 8, settingsLayout.contentInset, 0)]}
        >
          {footer}
        </Text>
      ) : null}
    </Column>
  );
}

export function NativeSettingsItem({
  title,
  subtitle,
  leading,
  value,
  trailing,
  onPress,
  testID,
  modifiers,
  onPositionChange,
  disabled = false,
  busy = false,
}: ComponentProps<typeof SharedSettings.NativeSettingsItem>) {
  const theme = useAppTheme();
  return (
    <ListItem
      colors={{ containerColor: theme.colors.surface }}
      modifiers={[
        fillMaxWidth(),
        alpha(disabled || busy ? 0.38 : 1),
        ...(onPress && !disabled && !busy ? [clickable(onPress)] : []),
        ...(testID ? [nativeTestID(testID)] : []),
        ...(onPositionChange ? [composeOnGloballyPositioned(onPositionChange)] : []),
        ...(modifiers ?? []),
      ]}
    >
      {leading ? (
        <ListItem.LeadingContent>{leading as ReactElement}</ListItem.LeadingContent>
      ) : null}
      <ListItem.HeadlineContent>
        {typeof title === 'string' ? <Text>{title}</Text> : title}
      </ListItem.HeadlineContent>
      {subtitle ? (
        <ListItem.SupportingContent>
          {typeof subtitle === 'string' ? <Text>{subtitle}</Text> : subtitle}
        </ListItem.SupportingContent>
      ) : null}
      {busy || trailing || value ? (
        <ListItem.TrailingContent>
          {busy ? (
            <CircularProgressIndicator modifiers={[size(24, 24)]} />
          ) : trailing ? (
            trailing
          ) : (
            <Text>{value}</Text>
          )}
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}

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
}: ComponentProps<typeof SharedSettings.NativeSettingsTextField>) {
  const { initialValue, nativeRef, onNativeValueChange } = useNativeTextFieldBridge({
    value,
    defaultValue,
    onChangeText,
    forwardedRef: ref,
  });
  const keyboardTypeMap = {
    default: 'text',
    'email-address': 'email',
    numeric: 'number',
    'phone-pad': 'phone',
    url: 'uri',
    'decimal-pad': 'decimal',
  } as const;
  const imeActionMap = {
    default: 'default',
    done: 'done',
    go: 'go',
    next: 'next',
    search: 'search',
    send: 'send',
  } as const;
  return (
    <NativeSettingsItem
      title={
        <ComposeTextField
          ref={nativeRef}
          defaultValue={initialValue}
          onValueChange={onNativeValueChange}
          enabled={editable}
          keyboardOptions={{
            ...(autoCapitalize ? { capitalization: autoCapitalize } : {}),
            ...(autoCorrect !== undefined ? { autoCorrectEnabled: autoCorrect } : {}),
            ...(keyboardType ? { keyboardType: keyboardTypeMap[keyboardType] } : {}),
            ...(returnKeyType ? { imeAction: imeActionMap[returnKeyType] } : {}),
          }}
          keyboardActions={
            onSubmitEditing
              ? {
                  onDone: onSubmitEditing,
                  onGo: onSubmitEditing,
                  onNext: onSubmitEditing,
                  onSearch: onSubmitEditing,
                  onSend: onSubmitEditing,
                }
              : undefined
          }
          modifiers={[
            fillMaxWidth(),
            height(minHeight),
            wrapContentHeight('centerVertically'),
            composeSemantics(label),
            ...(testID ? [nativeTestID(testID)] : []),
          ]}
        >
          <ComposeTextField.Label>{label}</ComposeTextField.Label>
          {placeholder ? (
            <ComposeTextField.Placeholder>{placeholder}</ComposeTextField.Placeholder>
          ) : null}
        </ComposeTextField>
      }
      trailing={trailing}
    />
  );
}

export function NativeSettingsButton({
  label,
  onPress,
  destructive,
  accessibilityLabel,
  disabled,
}: ComponentProps<typeof SharedSettings.NativeSettingsButton>) {
  const theme = useAppTheme();
  return (
    <TextButton
      onClick={onPress}
      enabled={!disabled}
      modifiers={accessibilityLabel ? [composeSemantics(accessibilityLabel)] : undefined}
    >
      <Text color={destructive ? theme.colors.danger : theme.colors.tint}>{label}</Text>
    </TextButton>
  );
}

export function NativeSettingsSwitch({
  title,
  subtitle,
  leading,
  value,
  onValueChange,
  disabled,
}: ComponentProps<typeof SharedSettings.NativeSettingsSwitch>) {
  return (
    <NativeSettingsItem
      title={title}
      subtitle={subtitle}
      leading={leading}
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      trailing={<Switch value={value} onCheckedChange={onValueChange} enabled={!disabled} />}
      modifiers={[alpha(disabled ? 0.38 : 1)]}
    />
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
}: ComponentProps<typeof SharedSettings.NativeSettingsPicker>) {
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const theme = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const selected = options.find((option) => option.value === value);
  const select = (next: string) => {
    setOpen(false);
    onValueChange?.(next);
  };

  return (
    <>
      <NativeSettingsItem
        title={title}
        leading={leading}
        subtitle={
          <Column>
            <Text color={theme.colors.textSecondary} style={{ typography: 'bodyMedium' }}>
              {selected?.title ?? value}
            </Text>
            {subtitle}
          </Column>
        }
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        modifiers={[alpha(disabled ? 0.38 : 1)]}
      />
      {open ? (
        <AlertDialog onDismissRequest={() => setOpen(false)}>
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Text>
            <LazyColumn
              modifiers={[
                fillMaxWidth(),
                height(Math.min(options.length * 56, 320, windowHeight * 0.5)),
                selectableGroup(),
              ]}
            >
              {options.map((option) => (
                <Row
                  key={option.value}
                  verticalAlignment="center"
                  horizontalArrangement={{ spacedBy: 16 }}
                  modifiers={[
                    fillMaxWidth(),
                    selectable(option.value === value, () => select(option.value), 'radioButton'),
                    height(56),
                    padding(0, 8, 0, 8),
                  ]}
                >
                  <RadioButton selected={option.value === value} />
                  <Column modifiers={[weight(1)]}>
                    <Text style={{ typography: 'bodyLarge' }}>{option.title}</Text>
                    {option.subtitle ? (
                      <Text color={theme.colors.textSecondary} style={{ typography: 'bodyMedium' }}>
                        {option.subtitle}
                      </Text>
                    ) : null}
                  </Column>
                </Row>
              ))}
            </LazyColumn>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={() => setOpen(false)}>
              <Text>{tr('common.cancel')}</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
        </AlertDialog>
      ) : null}
    </>
  );
}

export function NativeSettingsChoiceList({
  label,
  value,
  options,
  onValueChange,
  disabled = false,
}: ComponentProps<typeof SharedSettings.NativeSettingsChoiceList>) {
  const theme = useAppTheme();
  return (
    <NativeSettingsRows modifiers={[selectableGroup(), composeSemantics(label)]}>
      {options.map((option) => (
        <Row
          key={option.value}
          verticalAlignment="center"
          horizontalArrangement={{ spacedBy: settingsLayout.contentInset }}
          modifiers={[
            fillMaxWidth(),
            selectable(
              option.value === value,
              () => {
                if (!disabled) onValueChange(option.value);
              },
              'radioButton',
            ),
            alpha(disabled ? 0.38 : 1),
            padding(
              settingsLayout.contentInset,
              settingsLayout.rowPaddingVertical,
              settingsLayout.contentInset,
              settingsLayout.rowPaddingVertical,
            ),
          ]}
        >
          <RadioButton selected={option.value === value} />
          <Column modifiers={[weight(1)]}>
            <Text color={theme.colors.text} style={{ typography: 'bodyLarge' }}>
              {option.title}
            </Text>
            {option.subtitle ? (
              <Text color={theme.colors.textSecondary} style={{ typography: 'bodySmall' }}>
                {option.subtitle}
              </Text>
            ) : null}
          </Column>
        </Row>
      ))}
    </NativeSettingsRows>
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
}: ComponentProps<typeof SharedSettings.NativeSettingsSlider>) {
  return (
    <NativeSettingsItem
      title={title}
      leading={leading}
      value={formatValue ? formatValue(value) : String(value)}
      subtitle={
        <Column>
          {subtitle}
          <Slider
            value={value}
            min={min}
            max={max}
            steps={step ? Math.max(0, Math.round((max - min) / step) - 1) : 0}
            enabled={!disabled}
            onValueChange={onValueChange}
            modifiers={[fillMaxWidth()]}
          />
        </Column>
      }
    />
  );
}

export function NativeSettingsText({
  children,
  color,
  fontSize,
  fontWeight,
  maxLines,
  lineHeight,
  textAlign,
}: ComponentProps<typeof SharedSettings.NativeSettingsText>) {
  const composeWeight =
    fontWeight === 'regular'
      ? 'normal'
      : fontWeight === 'medium'
        ? '500'
        : fontWeight === 'semibold'
          ? '600'
          : fontWeight;
  return (
    <Text
      color={color}
      maxLines={maxLines}
      style={{
        fontSize,
        fontWeight: composeWeight,
        ...(lineHeight ? { lineHeight } : {}),
        ...(textAlign
          ? {
              textAlign:
                textAlign === 'leading' ? 'start' : textAlign === 'trailing' ? 'end' : 'center',
            }
          : {}),
      }}
    >
      {children}
    </Text>
  );
}
