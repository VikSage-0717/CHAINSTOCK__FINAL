import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface PredictionYearSliderProps {
  /** Called whenever the selected year changes */
  onValueChange?: (years: number) => void;
  /** Initial number of years (1-10). Defaults to 1. */
  initialValue?: number;
}

const MIN_YEARS = 1;
const MAX_YEARS = 10;

const PredictionYearSlider: React.FC<PredictionYearSliderProps> = ({
  onValueChange,
  initialValue = 1,
}) => {
  const [years, setYears] = useState<number>(initialValue);

  const handleChange = (value: number) => {
    const rounded = Math.round(value);
    setYears(rounded);
    onValueChange?.(rounded);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.valueLabel}>
        Prediction Range: {years} {years === 1 ? 'Year' : 'Years'}
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={MIN_YEARS}
        maximumValue={MAX_YEARS}
        step={1}
        value={years}
        onValueChange={handleChange}
        minimumTrackTintColor="#7C3AED"
        maximumTrackTintColor="#D1D5DB"
        thumbTintColor="#7C3AED"
      />

      <View style={styles.rangeLabelsRow}>
        <Text style={styles.rangeLabel}>{MIN_YEARS} Year</Text>
        <Text style={styles.rangeLabel}>{MAX_YEARS} Years</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  valueLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
});

export default PredictionYearSlider;
