import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, Button } from 'react-native';
import { Camera, CameraProps } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

type AddMediaComponentState = {
    // Camera
    hasCameraPermission: boolean;
    cameraPermissionCanAskAgain: boolean;
    gotCameraPermissionPromise: boolean;
    cameraReady: boolean;

    // Media lib
    hasMediaLibraryPermission: boolean;
    mediaLibraryPermissionCanAskAgain: boolean;
    gotMediaLibraryPermissionPromise: boolean;

    recording: boolean;
    cameraType: CameraProps['type'],
    cameraFlash: CameraProps['flashMode'],
}

export default class App extends React.Component<{}, AddMediaComponentState> {
    private camera: Camera|null = null;

    public constructor(props:any) {
        super(props);

        this.state = {
            gotCameraPermissionPromise: false,
            hasCameraPermission: false,
            cameraPermissionCanAskAgain: true,
            cameraReady: false,
            hasMediaLibraryPermission: false,
            mediaLibraryPermissionCanAskAgain: true,
            gotMediaLibraryPermissionPromise: false,

            recording: false,
            cameraType: Camera.Constants.Type.back,
            cameraFlash: Camera.Constants.FlashMode.auto,
        };

        this.authorize = this.authorize.bind(this);
        this.toggleVideo = this.toggleVideo.bind(this);
        this.renderNoPermissions = this.renderNoPermissions.bind(this);
        this.setCameraReady = this.setCameraReady.bind(this);
    }

    public async componentDidMount() {
        await this.authorize();
    }

    private async authorize() {
        const permissionCamera = await Camera.requestPermissionsAsync();
        const permissionLibrary = await MediaLibrary.requestPermissionsAsync();
        const permissionMicro = await Camera.requestMicrophonePermissionsAsync();

        this.setState({
            cameraPermissionCanAskAgain: permissionCamera.canAskAgain,
            hasCameraPermission: permissionCamera.granted,
            gotCameraPermissionPromise: true,
            hasMediaLibraryPermission: permissionLibrary.granted,
            mediaLibraryPermissionCanAskAgain: permissionLibrary.canAskAgain,
            gotMediaLibraryPermissionPromise: true,
        });
    }

    private async toggleVideo() {
        if(!this.camera) return;

        let { recording } = this.state;
        recording = !recording;

        this.setState({ recording });

        if (recording) {
            const permissions = await MediaLibrary.getPermissionsAsync();

            console.log("getPermissionsAsync", permissions);

            const recordPromise = this.camera.recordAsync({
                maxDuration: 5,
                quality: Camera.Constants.VideoQuality["720p"],
            });

            console.log("starting recording");
            const videoData = await recordPromise;
            console.log("recording done");
            recording = !recording;
            this.setState({ recording });


            console.log("creating asset", videoData);
            let asset = await MediaLibrary.createAssetAsync(videoData.uri);

            console.log("get album");
            const albumName = "test-video-album";
            let album = await MediaLibrary.getAlbumAsync(albumName);

            if (!album) {
                console.log("create album");
                album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
            } else {
                console.log("add to album");
                MediaLibrary.addAssetsToAlbumAsync(asset, album, false);
            }

            console.log("get asset info");
            let assetInfo = await MediaLibrary.getAssetInfoAsync(asset);

            let localUri = assetInfo.localUri;

            if(Platform.OS == "android") {
                localUri = videoData.uri;
            }

            console.log("done");
        }
    }


    private renderNoPermissions() {
        return (
            <View style={styles.noRights}>
                <Text style={[styles.noRightsText, { marginBottom: 30 }]}>We need rights.</Text>
                {this.state.cameraPermissionCanAskAgain && <Button title="Autoriser" onPress={this.authorize}></Button>}
            </View>
        );
    }

    private async setCameraReady() {
        this.setState({ cameraReady: true });
    }

    public render() {
        if (!this.state.gotCameraPermissionPromise) return null;
        if (!this.state.hasCameraPermission) return this.renderNoPermissions();

        return (
            <View style={{ flex: 1 }}>

                    <Camera
                        ratio="16:9"
                        ref={ref => { this.camera = ref; }}
                        style={styles.camera}
                        type={this.state.cameraType}
                        flashMode={this.state.cameraFlash}
                        onCameraReady={this.setCameraReady}
                    >
                    </Camera>

                    {this.state.cameraReady && <View style={{ flex: 1, position:"absolute", top:0, bottom:0, left:0, right:0, alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={styles.bottomButtons}>
                                <TouchableOpacity style={styles.videoButton} onPress={this.toggleVideo}>
                                    <View style={styles.videoRedButton} />
                                </TouchableOpacity>
                            </View>
                        </View>}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    noRights: {
        flex: 1,
        backgroundColor: "#333333",
        justifyContent: 'center',
        alignContent: "center",
        padding: 20,
    },
    noRightsText: {
        fontSize: 13,
        color: "white",
        textAlign: "center",
    },
    camera: {
        flex: 1,
        justifyContent: "flex-end",
        alignContent: "center",
        padding: 20,
    },
    bottomButtons: {
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        position:'absolute',
        bottom:0,
    },
    videoButton: {
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff88',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoRedButton: {
        height: 14,
        width: 14,
        borderRadius: 10,
        backgroundColor: "#ff0000",
    },
});
