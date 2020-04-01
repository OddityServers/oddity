import React, { useEffect, useState } from 'react'
import requester from '@helpers/requester'
import notificationHandler from '@helpers/notificationHandler'
import { Table, Tag, Button, Input } from 'antd'
import { RollbackOutlined } from '@ant-design/icons'

import moduleLoaderImports from '../../module_loader_imports'
import { connect } from 'react-redux'
import SavePopup from './SavePopup'

export default connect(state => ({
  configId: state.config.id,
  routes: state.modules.map(mod => mod.route)
}))(({ routes, configId }) => {
  const [modules, setModules] = useState([])
  const [SettingsComponent, setSettingsComponent] = useState(null)
  const [changes, setChanges] = useState([])

  useEffect(() => {
    requester.get('modules').then(modules => {
      modules
        .sort((a, b) => (a.enabled ? 1 : -1))
        .map(mod => {
          mod.adminPage = moduleLoaderImports.modules[mod.name].adminPage
          return mod
        })
      setModules(modules.sort((a, b) => (a === b ? 0 : a ? -1 : 1))) // sets enabled first
    })
  }, [routes])

  const setEnabled = id => {
    const enabled = !modules.find(mod => mod.id === id).enabled
    requester
      .patch(`modules/${id}/enabled`, { enabled })
      .then(() => {
        setModules(
          modules.map(mod => {
            if (mod.id === id) {
              mod.enabled = enabled
            }
            return mod
          })
        )
      })
      .catch(err => {
        notificationHandler.error('Could not enable Module', err.message)
      })
  }

  const routeChangeHandler = (id, value) => {
    setModules(
      modules.map(mod => {
        if (mod.id === id) mod.route = value
        return mod
      })
    )
    setChanges(
      changes.concat([
        {
          id: id,
          route: value
        }
      ])
    )
  }

  const handleSave = () => {
    changes.forEach(change => {
      requester
        .patch(`modules/${change.id}/route`, change)
        .then(updatedModules => {
          setModules(
            modules.map(mod => {
              const umod = updatedModules.find(umod => umod.id === mod.id)
              if (umod) mod.route = umod.route
              return mod
            })
          )
          setChanges([])
        })
        .catch(err => {
          console.error(err)
          notificationHandler.error('Could not update routes', err.message)
        })
    })
  }

  const columns = [
    {
      dataIndex: 'name'
    },
    {
      dataIndex: 'version'
    },
    {
      dataIndex: 'enabled',
      render: (enabled, record) =>
        enabled ? (
          <Tag
            className="clickable"
            onClick={() => setEnabled(record.id)}
            color="green"
          >
            Enabled
          </Tag>
        ) : (
          <Tag
            className="clickable"
            onClick={() => setEnabled(record.id)}
            color="red"
          >
            Disabled
          </Tag>
        )
    },
    {
      dataIndex: 'route',
      render: (route, record) => {
        if (record.enabled) {
          return (
            <Input
              type="text"
              prefix="/"
              placeholder="baseroute"
              onChange={e => routeChangeHandler(record.id, e.target.value)}
              value={route ? route : ''}
            />
          )
        }
      }
    },
    {
      dataIndex: 'enabled',
      render: (enabled, record) => {
        if (enabled && record.adminPage) {
          return (
            <>
              <Button
                onClick={() =>
                  setSettingsComponent(React.createElement(record.adminPage))
                }
              >
                Settings
              </Button>
            </>
          )
        }
      }
    }
  ]

  return (
    <div>
      {changes.length > 0 ? <SavePopup onSave={handleSave} /> : ''}
      {SettingsComponent ? (
        <>
          <Button
            style={{
              float: 'left',
              width: '25%',
              marginBottom: '10px',
              marginRight: '10px'
            }}
            type="primary"
            onClick={() => setSettingsComponent(null)}
          >
            <RollbackOutlined />
            Back
          </Button>
          {SettingsComponent}
        </>
      ) : (
        <Table
          pagination={false}
          showHeader={false}
          loading={modules.length === 0}
          columns={columns}
          rowKey="id"
          dataSource={modules}
        />
      )}
    </div>
  )
})
