import { useEffect, useRef, useState } from 'react';
import {
  ChoroplethMap,
  fetchAndParseCSV,
  transformDataForGraph,
  DataCards,
} from '@undp-data/undp-visualization-library';
import '@undp-data/undp-visualization-library/dist/style.css';
import { Select, Segmented } from 'antd';
import { Globe, LayoutGrid } from 'lucide-react';
import styled from 'styled-components';
import { Cards } from './Cards';

const { Option } = Select;

const StyledSegmented = styled(Segmented)`
  .ant-segmented-item {
    color: #666; /* Darker text color for non-selected items */
    background-color: var(
      --gray-300
    ); /* Background color for non-selected items */
  }

  .ant-segmented-item-selected {
    color: #666; /* Text color for the selected item */
    background-color: #fff; /* Background color for the selected item */
  }

  .ant-segmented-item:hover {
    color: #333; /* Darker text color on hover */
  }
`;

function App() {
  const [data, setData] = useState<any[] | null>(null);
  const [taxonomy, setTaxonomy] = useState<any[] | null>(null);
  const [selectedColumn, setSelectedColumn] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all_countries');
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<'Map' | 'Cards'>('Map');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      const sidsCodes = taxonomy
        .filter((country: any) => country.SIDS === true)
        .map((country: any) => country['Alpha-3 code']);
      const ldcCodes = taxonomy
        .filter((country: any) => country.LDC === true)
        .map((country: any) => country['Alpha-3 code']);

      const countryGroupFiltered = data
        .filter(row => {
          return (
            selectedCategory === 'all_countries' ||
            (selectedCategory === 'sids' && sidsCodes.includes(row.iso)) ||
            (selectedCategory === 'ldcs' && ldcCodes.includes(row.iso)) ||
            (selectedCategory === 'fragile' && row.fragile === 1)
          );
        })
        .map(row => row.iso);

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
        <h2 className='undp-typography bold'>
          UNDP’s work on sustainable finance
        </h2>
        <Cards
          dataStatCard={data}
          values={['all', 'public', 'private_impact', 'inffs', 'academy']}
          titles={[
            'All Sustainable Finance Programmes',
            'Public Finance for the SDGs',
            'Private Finance for the SDGs',
            'INFFs',
            'Biodiversity finance',
            'Academy',
          ]}
        />
        <div
          id='vizArea'
          style={{
            display: 'inline-flex',
            width: '100%',
            border: '0.07rem solid var(--gray-400)',
            maxWidth: '1980px',
          }}
        >
          {/* Left Sidebar */}
          <div
            className='flex-div flex-column'
            style={{
              width: '20%',
              gap: '1rem',
              borderRight: '0.07rem solid var(--gray-400)',
              padding: '1.25rem',
            }}
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

          {/* Right Content Area */}
          <div style={{ width: '80%', position: 'relative' }}>
            {/* Segmented Button Aligned to Top Right */}
            <div
              style={{ position: 'absolute', right: '0.5rem', top: '0.5rem' }}
            >
              <StyledSegmented
                options={[
                  {
                    label: (
                      <div className='flex-div flex-vert-align-center gap-02'>
                        <Globe strokeWidth={1.7} size={16} /> Map
                      </div>
                    ),
                    value: 'Map',
                  },
                  {
                    label: (
                      <div className='flex-div flex-vert-align-center gap-02'>
                        <LayoutGrid strokeWidth={1.7} size={16} /> Cards
                      </div>
                    ),
                    value: 'Cards',
                  },
                ]}
                value={viewMode}
                onChange={(value: any) => setViewMode(value)}
                style={{
                  margin: '0.5rem 0.5rem 0.5rem auto',
                  width: 'fit-content',
                }}
              />
            </div>

            {/* Conditionally Render Map or Cards */}
            {viewMode === 'Map' ? (
              <ChoroplethMap
                data={transformDataForGraph(data, 'choroplethMap', [
                  { chartConfigId: 'countryCode', columnId: 'iso' },
                  { chartConfigId: 'x', columnId: 'all' },
                ])}
                height={650}
                backgroundColor='var(--gray-100)'
                scale={260}
                padding='1.25rem'
                centerPoint={[0, 25]}
                showAntarctica={false}
                zoomScaleExtend={[1, 1]}
                domain={[0, 0.5, 0.7]}
                showColorScale={false}
                highlightedCountryCodes={highlightedCountries}
              />
            ) : (
              <DataCards
                data={[
                  {
                    label: 'Project A',
                    category: 'Category 1',
                    description: 'Lorem ipsum dolor sit amet <...>',
                  },
                  {
                    label: 'Project B',
                    category: 'Category 2',
                    description: 'Lorem ipsum dolor sit amet <...>',
                  },
                  {
                    label: 'Project C',
                    category: 'Category 3',
                    description: 'Lorem ipsum dolor sit amet <...>',
                  },
                ]}
                height={650}
                padding='3rem 1.25rem'
                sources={[
                  {
                    source: 'Organization ABC',
                    link: 'https://data.undp.org',
                  },
                ]}
                footNote='Footnote of the graph'
                cardSearchColumns={['label']}
                cardTemplate="<div style='padding: 24px;'>
                  <h6 class='undp-viz-typography'>{{label}}</h6>
                  <p class='undp-viz-typography' style='font-size: 16px;'>{{description}}</p></div>"
                backgroundColor='var(--gray-100)'
                cardBackgroundColor='#fff'
                cardDetailView="<div style='padding: 24px;'>test</div>"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
