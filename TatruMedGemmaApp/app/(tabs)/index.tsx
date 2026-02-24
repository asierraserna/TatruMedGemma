import React, { useEffect, useState } from 'react';
import { Alert, View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { ChatSession } from '../../types';
import {
  checkActiveProviderConnection,
  getInferenceModeLabel,
} from '../../services/inference/router';
import { useInferenceStore } from '../../store/inferenceStore';
import { downloadDeviceModel, getDeviceModelState } from '../../services/inference/deviceModelService';

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, actions } = useChatStore();
  const inferenceMode = useInferenceStore((state) => state.mode);
  const lanBaseUrl = useInferenceStore((state) => state.lan.baseUrl);
  const lanModel = useInferenceStore((state) => state.lan.model);
  const flaskBaseUrl = useInferenceStore((state) => state.flask.baseUrl);
  const cloudBaseUrl = useInferenceStore((state) => state.cloud.baseUrl);
  const kaggleGradioUrl = useInferenceStore((state) => state.kaggle.gradioUrl);
  const deviceGgufUrl = useInferenceStore((state) => state.device.ggufUrl);
  const deviceMmprojUrl = useInferenceStore((state) => state.device.mmprojUrl);
  const [providerConnected, setProviderConnected] = useState<boolean | null>(null);
  const [preparingDeviceModel, setPreparingDeviceModel] = useState(false);
  const [deviceModelStatus, setDeviceModelStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadConnectionStatus = async () => {
      const status = await checkActiveProviderConnection();
      if (active) {
        setProviderConnected(status.connected);
      }

      if (active && inferenceMode === 'device') {
        const modelState = await getDeviceModelState();
        setDeviceModelStatus(modelState.ggufExists ? 'Ready' : 'Not downloaded');
      }
    };

    loadConnectionStatus();

    return () => {
      active = false;
    };
  }, [
    inferenceMode,
    lanBaseUrl,
    lanModel,
    flaskBaseUrl,
    cloudBaseUrl,
    kaggleGradioUrl,
    deviceGgufUrl,
    deviceMmprojUrl,
  ]);

  const handlePrepareDeviceModel = async () => {
    setPreparingDeviceModel(true);
    setDeviceModelStatus('Downloading GGUF...');

    try {
      await downloadDeviceModel({
        onProgress: (progress) => {
          const targetLabel = progress.stage === 'mmproj' ? 'mmproj' : 'GGUF';
          const statusLabel =
            progress.percent != null ? `Downloading ${targetLabel} (${progress.percent}%)` : `Downloading ${targetLabel}`;
          setDeviceModelStatus(statusLabel);
        },
      });

      setDeviceModelStatus('Ready');
      setProviderConnected(true);
    } catch (error) {
      const message = (error as Error).message || 'Failed to download GGUF model.';
      setDeviceModelStatus('Error');
      setProviderConnected(false);
      Alert.alert('On-device model download failed', message, [
        {
          text: 'Retry',
          onPress: () => {
            handlePrepareDeviceModel();
          },
        },
        { text: 'Close', style: 'cancel' },
      ]);
    } finally {
      setPreparingDeviceModel(false);
    }
  };

  const handleNewChat = () => {
    const sessionId = actions.createNewSession();
    router.push(`/chat/${sessionId}`);
  };

  const deleteSession = (e: any, id: string) => {
    e.stopPropagation();
    actions.deleteSession(id);
  };

  const renderItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.cardContent}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#007AFF" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.lastUpdated).toLocaleDateString()} {new Date(item.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        <TouchableOpacity onPress={(e) => deleteSession(e, item.id)} style={styles.deleteButton}>
           <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>GemmaMed Help</Text>
          <Text
            style={[
              styles.connectionStatus,
              providerConnected === null
                ? styles.connectionUnknown
                : providerConnected
                  ? styles.connectionUp
                  : styles.connectionDown,
            ]}
          >
            {providerConnected === null
              ? `● Checking ${getInferenceModeLabel(inferenceMode)}...`
              : providerConnected
                ? `● ${getInferenceModeLabel(inferenceMode)} connected`
                : `● ${getInferenceModeLabel(inferenceMode)} offline`}
          </Text>
          {inferenceMode === 'lan' && (
            <Text style={styles.modelStatus}>
              {`Model: ${lanModel}`}
            </Text>
          )}
          {inferenceMode === 'device' && (
            <Text style={styles.modelStatus}>
              {`On-device model: ${deviceModelStatus || 'Not downloaded'}`}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={18} color="#fff" />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
          {inferenceMode === 'device' && (
            <TouchableOpacity
              onPress={handlePrepareDeviceModel}
              style={[styles.pullButton, preparingDeviceModel && styles.pullButtonDisabled]}
              disabled={preparingDeviceModel}
            >
              <Ionicons name="cloud-download-outline" size={18} color="#fff" />
              <Text style={styles.pullButtonText}>{preparingDeviceModel ? 'Downloading...' : 'Download GGUF'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="medical-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Start a new consultation</Text>
          <TouchableOpacity onPress={handleNewChat} style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  connectionStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  connectionUnknown: {
    color: '#8e8e93',
  },
  connectionUp: {
    color: '#34c759',
  },
  connectionDown: {
    color: '#ff3b30',
  },
  modelStatus: {
    fontSize: 12,
    marginTop: 4,
    color: '#8e8e93',
    maxWidth: 240,
  },
  settingsButton: {
    flexDirection: 'row',
    backgroundColor: '#8e8e93',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  pullButton: {
    flexDirection: 'row',
    backgroundColor: '#34c759',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  pullButtonDisabled: {
    opacity: 0.7,
  },
  pullButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  newChatButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  newChatText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 1px 2px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e93',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#8e8e93',
  },
  startButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
