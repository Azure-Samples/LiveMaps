import React from "react";
import { Callout, Separator, Text, Target, getTheme, FontWeights, mergeStyleSets } from '@fluentui/react';

const theme = getTheme();
const styles = mergeStyleSets({
  callout: {
    maxWidth: 300,
    pointerEvents: 'none',
  },
  header: {
    padding: '18px 24px 12px',
  },
  title: [
    theme.fonts.xLarge,
    {
      margin: 0,
      fontWeight: FontWeights.semilight,
    },
  ],
  inner: {
    height: '100%',
    padding: '0 24px 20px',
  },
  subtext: [
    theme.fonts.small,
    {
      margin: 0,
      fontWeight: FontWeights.semilight,
    },
  ],
});


interface PopoverProps {
  title: string;
  body: React.ReactElement;
  target: Target;
  onDismiss?: () => void;
}

const Popover: React.FC<PopoverProps> = ({ title, body, target, onDismiss }) => {
  return (
    <Callout
      className={styles.callout}
      gapSpace={0}
      target={target}
      onDismiss={onDismiss}
      setInitialFocus
    >
      <div className={styles.header}>
        <Text className={styles.title}>
          {title}
        </Text>
      </div>
      <Separator />
      <div className={styles.inner}>
        <Text className={styles.subtext}>
          {body}
        </Text>;
      </div>
    </Callout>
  );
}

export default Popover;
