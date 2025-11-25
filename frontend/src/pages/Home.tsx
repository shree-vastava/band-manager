import React, { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Select, Spin, Divider, Modal, Form, Input, message } from 'antd';
import { 
  DashboardOutlined, 
  UnorderedListOutlined, 
  CalendarOutlined,
  LogoutOutlined,
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useBand } from '../contexts/BandContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { bandService } from '../services/bandService';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const { bands, currentBand, setCurrentBand, loading: bandsLoading, refreshBands } = useBand();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Modal state for creating new band
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/home/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/home/setlists',
      icon: <UnorderedListOutlined />,
      label: 'Setlists',
    },
    {
      key: '/home/shows',
      icon: <CalendarOutlined />,
      label: 'Shows',
    },
    {
      key: '/home/manage-band',
      icon: <SettingOutlined />,
      label: 'Manage Band',
    },
  ];

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleBandChange = (value: number | string) => {
    if (value === 'create-new') {
      // Open modal to create new band
      setIsModalVisible(true);
    } else {
      const selectedBand = bands.find(b => b.id === value);
      if (selectedBand) {
        setCurrentBand(selectedBand);
      }
    }
  };

  const handleCreateBand = async (values: { name: string }) => {
    try {
      setCreateLoading(true);
      const newBand = await bandService.createBand({ name: values.name });
      message.success('Band created successfully!');
      
      // Refresh bands list and set the new band as current
      await refreshBands();
      setCurrentBand(newBand);
      
      // Close modal and reset form
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to create band');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Custom dropdown render to add "Create Band" option
  const dropdownRender = (menu: React.ReactNode) => (
    <>
      {menu}
      <Divider style={{ margin: '8px 0' }} />
      <div
        style={{ 
          padding: '8px 12px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#1890ff'
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleBandChange('create-new')}
      >
        <PlusOutlined />
        Create New Band
      </div>
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ background: '#001529' }}
        width={250}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold'
        }}>
          {collapsed ? 'BM' : 'Band Management'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 48px', 
          display: 'flex', 
          flexDirection: 'row',
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: 64
        }}>
          <Space size="large">
            <Text strong style={{ fontSize: 18 }}>Welcome, {user?.name}!</Text>
            
            {/* Band Selector */}
            {bandsLoading ? (
              <Spin size="small" />
            ) : (
              <Select
                value={currentBand?.id}
                onChange={handleBandChange}
                style={{ minWidth: 200 }}
                size="large"
                placeholder="Select a band"
                dropdownRender={dropdownRender}
              >
                {bands.map(band => (
                  <Select.Option key={band.id} value={band.id}>
                    {band.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Space>

          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            size="large"
            type="default"
          >
            Logout
          </Button>
        </Header>
        
        <Content style={{ 
          margin: '32px 48px', 
          background: '#fff', 
          padding: '48px', 
          minHeight: 280,
          borderRadius: 8
        }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Create Band Modal */}
      <Modal
        title="Create New Band"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateBand}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Band Name"
            rules={[
              { required: true, message: 'Please enter a band name!' },
              { min: 2, message: 'Band name must be at least 2 characters!' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="Enter band name" 
              prefix={<UnorderedListOutlined />} 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleModalCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                Create Band
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Home;