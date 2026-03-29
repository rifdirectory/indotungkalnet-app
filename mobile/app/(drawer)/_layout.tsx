import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { View } from 'react-native';
import { Drawer } from 'expo-router/drawer';

import CustomDrawerContent from '../../components/CustomDrawerContent';
import GlobalShiftFooter from '../../components/GlobalShiftFooter';

export default function DrawerLayout() {
  return (
    <View className="flex-1 bg-white">
        <View className="flex-1">
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'slide',
                    overlayColor: 'rgba(0,0,0,0.5)',
                    drawerStyle: {
                        width: '80%',
                        backgroundColor: '#fff',
                    },
                }}
            >
                <Drawer.Screen 
                    name="home" 
                    options={{ 
                        drawerLabel: 'Dashboard',
                        title: 'Dashboard'
                    }} 
                />
            </Drawer>
        </View>
        
        {/* Persistent Shift Footer Navbar - High Compatability Version */}
        <GlobalShiftFooter />
    </View>
  );
}
