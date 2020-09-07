import React, { useState, useEffect } from "react";
import { Slider as FluentSlider, Text, IconButton } from "@fluentui/react";

import "./SliderControl.scss";

interface SliderProps {
  name: string;
  value?: number;
  minValue: number;
  maxValue: number;
  disabled?: boolean;
  onSave?(newValue: number): void;
}

export const SliderControl: React.FC<SliderProps> = ({ name, value, minValue, maxValue, disabled, onSave }) => {
  const initialValue = Math.floor(value ?? minValue + (maxValue - minValue) / 2);
  const [internalValue, setInternalValue] = useState<number>(initialValue);
  useEffect(() => setInternalValue(initialValue), [initialValue]);

  return (
    <div className="slider-item">
      <div className="label-container">
        <Text className="label" contentEditable={false}>
          {name}
        </Text>
        <Text className="value">{disabled ? "-" : internalValue}</Text>
      </div>
      <div className="slider-container">
        <FluentSlider
          styles={{
            root: "slider",
            slideBox: "slidebox"
          }}
          value={internalValue}
          disabled={disabled}
          showValue={false}
          min={minValue}
          max={maxValue}
          onChange={setInternalValue}
        />
        <IconButton
          iconProps={{ iconName: "Save" }}
          disabled={disabled || internalValue === value}
          onClick={() => onSave && onSave(internalValue)}
          title={`Save ${name}`}
          ariaLabel={`Save ${name}`}
        />
        <IconButton
          iconProps={{ iconName: "Cancel" }}
          disabled={disabled || internalValue === initialValue}
          onClick={() => setInternalValue(initialValue)}
          title={`Discard ${name} changes`}
          ariaLabel={`Discard ${name} changes`}
        />
      </div>
    </div>
  );
};
