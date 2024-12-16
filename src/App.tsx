import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChoroplethMap,
  fetchAndParseCSV,
  transformDataForGraph,
  DataCards,
} from '@undp-data/undp-visualization-library';
import '@undp-data/undp-visualization-library/dist/style.css';
import { Select, Segmented, Radio } from 'antd';
import { Globe, LayoutGrid } from 'lucide-react';
import styled from 'styled-components';
import { Cards } from './Cards';
import './styles.css';

const { Option } = Select;

const ViewContainer = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'block' : 'none')};
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

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
  const [viewMode, setViewMode] = useState<'Map' | 'Cards'>('Map');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const d = (await fetchAndParseCSV('/data.csv')) as any[];

        // Prefilter data based on the 'all' column
        const prefilteredData = d.filter(row => row.all >= 1);
        setData(prefilteredData);
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

  // Compute highlighted countries directly based on selectedCategory
  const filteredData = useMemo(() => {
    if (!data || !taxonomy) return [];

    const sidsCodes = taxonomy
      .filter((country: any) => country.SIDS === true)
      .map((country: any) => country['Alpha-3 code']);
    const ldcCodes = taxonomy
      .filter((country: any) => country.LDC === true)
      .map((country: any) => country['Alpha-3 code']);

    return data.filter(row => {
      return (
        selectedCategory === 'all_countries' ||
        (selectedCategory === 'sids' && sidsCodes.includes(row.iso)) ||
        (selectedCategory === 'ldcs' && ldcCodes.includes(row.iso)) ||
        (selectedCategory === 'fragile' && row.fragile === 1)
      );
    });
  }, [data, taxonomy, selectedCategory]);

  // Use filteredData to derive highlightedCountries
  const highlightedCountries = useMemo(() => {
    return filteredData.map(row => row.iso);
  }, [filteredData]);

  if (!data || !taxonomy) {
    return (
      <div className='undp-loader-container undp-container'>
        <div className='undp-loader' />
      </div>
    );
  }
  console.log(data);

  return (
    <div className='undp-container' style={{ maxWidth: '1980px' }}>
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
              <p className='undp-typography small-font margin-00 padding-bottom-02'>
                Select country group
              </p>
              <Radio.Group
                onChange={e => setSelectedCategory(e.target.value)}
                value={selectedCategory}
                className='undp-radio'
              >
                <Radio value='all_countries'>All Countries</Radio>
                <Radio value='sids'>SIDS</Radio>
                <Radio value='ldcs'>LDCs</Radio>
                <Radio value='fragile'>Fragile and conflict-affected</Radio>
              </Radio.Group>
            </div>
          </div>

          {/* Right Content Area */}
          <div style={{ width: '80%', position: 'relative' }}>
            {/* Segmented Button Aligned to Top Right */}
            <div
              className='undp-container'
              style={{ position: 'relative', maxHeight: '2160px' }}
            >
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

              {/* Map View */}
              <ViewContainer isVisible={viewMode === 'Map'}>
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
              </ViewContainer>

              {/* Cards View */}
              <ViewContainer isVisible={viewMode === 'Cards'}>
                <DataCards
                  data={filteredData}
                  padding='3rem 1.25rem'
                  sources={[
                    {
                      source: 'Organization ABC',
                      link: 'https://data.undp.org',
                    },
                  ]}
                  footNote='Footnote of the graph'
                  cardSearchColumns={['country']}
                  cardTemplate="<div class='customCard'><div class='customCardTop'><p class='undp-viz-typography' style='font-size: 20px;'>{{country}}</p>{{#if services}}<div><p class='undp-viz-typography'>Services:</p><div class='chips'>{{#if public}}<div class='chip public-chip'>Public finance</div>{{/if}}{{#if private}}<div class='chip private-chip'>Private finance</div>{{/if}}{{#if inffs}}<div class='chip inffs-chip'>INFFs</div></br>{{/if}}{{#if academy}}<div class='chip academy-chip'>SDG Finance Academy</div>{{/if}}</div></div>{{/if}}{{#if work_areas}}<div><p class='undp-viz-typography'>Work areas:</p><div class='chips'>{{#if biofin}}<div class='chip biofin-chip'>Biodiversity finance</div>{{/if}}</div></div>{{/if}}</div><div class='cta-button'>Read more</div></div>"
                  backgroundColor='var(--gray-100)'
                  cardBackgroundColor='#fff'
                  cardDetailView="<div style='padding:24px;'><h5 class='undp-viz-typography'>{{country}}</h5>{{#if services}}<h6 class='undp-viz-typography'>Services ({{services}})</h6><div class='chips'>{{#if public}}<div class='chip public-chip'>Public Finance for the SDGs</div>{{#if public_tax}}<div class='chip chip-sub public-chip-sub'>Tax for the SDGs</div>{{/if}}{{#if public_debt}}<div class='chip chip-sub public-chip-sub'>Debt for the SDGs</div>{{/if}}{{#if public_budget}}<div class='chip chip-sub public-chip-sub'>Budget for the SDGs</div>{{/if}}{{#if public_insurance}}<div class='chip chip-sub public-chip-sub'>Insurance and risk finance</div>{{/if}}</br>{{/if}}{{#if private}}<div class='chip private-chip'>Private Finance for the SDGs</div>{{#if private_pipelines}}<div class='chip chip-sub private-chip-sub'>Originating pipelines</div>{{/if}}{{#if private_impact}}<div class='chip chip-sub private-chip-sub'>Managing for impact</div>{{/if}}{{#if private_environment}}<div class='chip chip-sub private-chip-sub'>Enabling environment</div>{{/if}}</br>{{/if}}{{#if inffs}}<div class='chip inffs-chip'>INFFs</div></br>{{/if}}{{#if academy}}<div class='chip academy-chip'>SDG Finance Academy</div>{{/if}}</div>{{/if}}{{#if work_areas}}<h6 class='undp-viz-typography'>Work areas ({{work_areas}})</h6><div class='chips'>{{#if gender_equality}}<div class='chip gender-equality-chip'>Gender equality</div>{{/if}}{{#if biofin}}<div class='chip biofin-chip'>Biodiversity finance</div>{{/if}}{{#if climate_finance}}<div class='chip climate-finance-chip'>Climate finance</div>{{/if}}</div>{{/if}}</div>"
                />
              </ViewContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
