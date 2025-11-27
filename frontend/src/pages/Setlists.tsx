import React, { useState } from 'react';
import { Tabs } from 'antd';
import { UnorderedListOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { useBand } from '../contexts/BandContext';
import SongsTab from '../components/setlists/SongsTab';
import SetlistsTab from '../components/setlists/SetlistsTab';

const Setlists: React.FC = () => {
  const { currentBand } = useBand();
  const [activeTab, setActiveTab] = useState('songs');
  const [songsRefreshKey, setSongsRefreshKey] = useState(0);
  const [setlistsRefreshKey, setSetlistsRefreshKey] = useState(0);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Refresh tab data when switching to it
    if (key === 'songs') {
      setSongsRefreshKey((prev) => prev + 1);
    } else if (key === 'setlists') {
      setSetlistsRefreshKey((prev) => prev + 1);
    }
  };

  if (!currentBand) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <CustomerServiceOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
        <h3>No Band Selected</h3>
        <p>Please select a band from the dropdown or create a new one.</p>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'songs',
      label: (
        <span>
          <CustomerServiceOutlined />
          Songs
        </span>
      ),
      children: <SongsTab key={songsRefreshKey} />,
    },
    {
      key: 'setlists',
      label: (
        <span>
          <UnorderedListOutlined />
          Setlists
        </span>
      ),
      children: <SetlistsTab key={setlistsRefreshKey} />,
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default Setlists;