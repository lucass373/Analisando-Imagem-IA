interface Measure {
    measure_uuid: string;
    measure_datetime: Date;
    measure_type: 'WATER' | 'GAS';
    measure_value: string;
    has_confirmed: number;
    image_url: string;
  }
  
  interface CustomerMeasure {
    customer_code: string;
    measures: Measure[];
  }
  
  const measures: CustomerMeasure[] = [];
  
  export { measures };
  