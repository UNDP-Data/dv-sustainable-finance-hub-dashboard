import { useEffect, useRef, useState } from 'react';
import {
  ChoroplethMap,
  fetchAndParseCSV,
  StatCardFromData,
  transformDataForGraph,
} from '@undp-data/undp-visualization-library';
import '@undp-data/undp-visualization-library/dist/style.css';
import { Select } from 'antd';

const { Option } = Select;

function AppMap() {
  const [data, setData] = useState<any[] | null>(null);
  const [taxonomy, setTaxonomy] = useState<any[] | null>(null); // Adjusted to an array based on data structure
  const [selectedColumn, setSelectedColumn] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all_countries');
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>(
    [],
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load main data
    const loadData = async () => {
      try {
        const d = (await fetchAndParseCSV('/data.csv')) as any[];
        setData(d);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Load taxonomy data for category filters
    const loadTaxonomy = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/UNDP-Data/country-taxonomy-from-azure/main/country_territory_groups.json',
        );
        const taxonomyData = await response.json();
        setTaxonomy(taxonomyData);
      } catch (error) {
        console.error('Error loading taxonomy data:', error);
      }
    };
    loadTaxonomy();
  }, []);
  useEffect(() => {
    if (data && taxonomy) {
      // Extract ISO codes for SIDS and LDCs based on boolean fields
      const sidsCodes = taxonomy
        .filter((country: any) => country.SIDS === true)
        .map((country: any) => country['Alpha-3 code']);
      const ldcCodes = taxonomy
        .filter((country: any) => country.LDC === true)
        .map((country: any) => country['Alpha-3 code']);

      // Step 1: Filter by country group
      const countryGroupFiltered = data
        .filter(row => {
          return (
            selectedCategory === 'all_countries' ||
            (selectedCategory === 'sids' && sidsCodes.includes(row.iso)) ||
            (selectedCategory === 'ldcs' && ldcCodes.includes(row.iso)) ||
            (selectedCategory === 'fragile' && row.fragile === 1) // Check if the fragile column has a value of 1
          );
        })
        .map(row => row.iso);

      // Step 2: Filter the result by service, if applicable
      let finalHighlightedCountries = countryGroupFiltered;
      if (selectedColumn !== 'all') {
        const hasDataInSelectedColumn = data.some(
          row => row[selectedColumn] !== undefined,
        );

        if (hasDataInSelectedColumn) {
          finalHighlightedCountries = countryGroupFiltered.filter(isoCode => {
            const countryData = data.find(row => row.iso === isoCode);
            return countryData && countryData[selectedColumn] === 1;
          });
        }
      }

      setHighlightedCountries(finalHighlightedCountries);
    } else {
      setHighlightedCountries([]);
    }
  }, [data, taxonomy, selectedColumn, selectedCategory]);

  if (!data || !taxonomy) {
    return (
      <div className='undp-loader-container undp-container'>
        <div className='undp-loader' />
      </div>
    );
  }

  return (
    <div className='undp-container'>
      <div className='padding-05 margin-05' ref={containerRef}>
        <h5 className='undp-typography bold'>
          UNDP’s work on sustainable finance
        </h5>

        <div id='statCards' className='flex-div margin-bottom-05'>
          <StatCardFromData
            data={transformDataForGraph(data, 'statCard', [
              {
                chartConfigId: 'value',
                columnId: 'all',
              },
            ])}
            backgroundColor
            graphTitle='All countries'
            aggregationMethod='sum'
          />
          <StatCardFromData
            data={transformDataForGraph(data, 'statCard', [
              {
                chartConfigId: 'value',
                columnId: 'private_impact',
              },
            ])}
            backgroundColor
            graphTitle='Countries with public finance services'
            aggregationMethod='sum'
          />
          <StatCardFromData
            data={transformDataForGraph(data, 'statCard', [
              {
                chartConfigId: 'value',
                columnId: 'public',
              },
            ])}
            backgroundColor
            graphTitle='Countries with private finance services'
            aggregationMethod='sum'
          />
          <StatCardFromData
            data={transformDataForGraph(data, 'statCard', [
              {
                chartConfigId: 'value',
                columnId: 'inffs',
              },
            ])}
            backgroundColor
            graphTitle='Countries with INFFs'
            aggregationMethod='sum'
          />
          <StatCardFromData
            data={transformDataForGraph(data, 'statCard', [
              {
                chartConfigId: 'value',
                columnId: 'academy',
              },
            ])}
            backgroundColor
            graphTitle='Countries with finance academy'
            aggregationMethod='sum'
          />
        </div>

        <div id='vizArea' className='flex-div'>
          <div
            className='flex-div flex-column'
            style={{ width: 'calc(20% - 1rem)', gap: '1rem' }}
          >
            <div>
              <p className='undp-typography small-font margin-00'>
                Select primary service or work area
              </p>
              <Select
                value={selectedColumn}
                className='undp-select not-to-be-embedded margin-top-03'
                onChange={value => setSelectedColumn(value)}
              >
                <Option value='all'>All Services and Work Areas</Option>
                <Option value='private_impact'>Private Impact</Option>
                <Option value='public'>Public</Option>
                <Option value='inffs'>INFFs</Option>
                <Option value='academy'>Academy</Option>
              </Select>
            </div>
            <div>
              <p className='undp-typography small-font margin-00'>
                Select country group
              </p>
              <Select
                value={selectedCategory}
                className='undp-select not-to-be-embedded margin-top-03'
                onChange={value => setSelectedCategory(value)}
              >
                <Option value='all_countries'>All Countries</Option>
                <Option value='sids'>SIDS</Option>
                <Option value='ldcs'>LDCs</Option>
                <Option value='fragile'>Fragile and conflict-affected</Option>
              </Select>
            </div>
          </div>

          <div style={{ width: 'calc(80% - 1rem' }}>
            <ChoroplethMap
              data={transformDataForGraph(data, 'choroplethMap', [
                { chartConfigId: 'countryCode', columnId: 'iso' },
                { chartConfigId: 'x', columnId: 'all' },
              ])}
              height={1000}
              centerPoint={[0, 0]}
              showAntarctica={false}
              zoomScaleExtend={[1, 1]}
              domain={[0, 0.5, 0.7]}
              showColorScale={false}
              highlightedCountryCodes={highlightedCountries}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppMap;
