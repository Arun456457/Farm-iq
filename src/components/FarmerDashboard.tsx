import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Package, ShoppingBag, IndianRupee, MapPin, Calendar, Leaf, 
  Trash2, Upload, AlertCircle, CheckCircle, Info, Clock, ArrowUpRight, TrendingUp, Sparkles,
  FilePlus, AlertTriangle, Send, CheckCheck, RefreshCw, Phone, User as UserIcon,
  Building2, ShieldCheck, Award, Sliders, Check, ExternalLink, Briefcase, ChevronRight,
  Truck, ArrowRight, Users, Pencil, Search, FileText, QrCode, Navigation, SlidersHorizontal,
  MessageSquare, Banknote, UserPlus
} from 'lucide-react';
import { User, Product, Order, LanguageCode, CustomerRequirement, Dispute, FPOLot, VerifiedBuyer, QualityGrade, FPOMemberFarmer, NetworkFarmer, Invoice, FPOCollective, FPOCollectiveMember, DigitalContract } from '../types';
import { api, setStoredUser } from '../api';
import { translations, tr, translateCrop, translateUnit, translateCategory } from '../translations';
import { InvoiceModal } from './InvoiceModal';
import { LocationPickerModal } from './LocationPickerModal';
import { EscrowFPOModal } from './EscrowFPOModal';
import { mandiMarkets } from '../data/mandiDatabase';

interface FarmerDashboardProps {
  user: User;
  language: LanguageCode;
  onProduceAdded: () => void;
  activeSubTab?: 'my-produce' | 'fpo-lots' | 'farmer-orders' | 'buyer-requirements' | 'disputes' | 'payment-settings';
  onNavigateToStorage?: () => void;
  onOpenInvoice?: (orderId: number) => void;
  onSubTabChange?: (tab: string) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  user,
  language,
  onProduceAdded,
  activeSubTab = 'my-produce',
  onNavigateToStorage,
  onOpenInvoice,
  onSubTabChange,
}) => {
  const t = translations[language];
  const [subTab, setSubTab] = useState<'my-produce' | 'fpo-lots' | 'farmer-orders' | 'buyer-requirements' | 'disputes' | 'payment-settings'>(() => {
    try {
      const saved = sessionStorage.getItem('farmiq_farmer_subtab');
      if (saved && ['my-produce', 'fpo-lots', 'farmer-orders', 'buyer-requirements', 'disputes', 'payment-settings'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return activeSubTab;
  });

  const handleSwitchSubTab = (tab: 'my-produce' | 'fpo-lots' | 'farmer-orders' | 'buyer-requirements' | 'disputes' | 'payment-settings') => {
    setSubTab(tab);
    try {
      sessionStorage.setItem('farmiq_farmer_subtab', tab);
    } catch {}
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };
  
  // Data state
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [lots, setLots] = useState<FPOLot[]>([]);
  const [verifiedBuyers, setVerifiedBuyers] = useState<VerifiedBuyer[]>([]);
  const [farmerContracts, setFarmerContracts] = useState<DigitalContract[]>([]);
  const [fpoModalContract, setFpoModalContract] = useState<DigitalContract | null>(null);
  const [selectedLotForMatch, setSelectedLotForMatch] = useState<FPOLot | null>(null);
  const [showCreateLotModal, setShowCreateLotModal] = useState(false);
  const [matchingLotId, setMatchingLotId] = useState<string | null>(null);
  const [matchingSuccessMsg, setMatchingSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FPO Collectives & Multi-Farmer Pooling States
  const [fpoViewMode, setFpoViewMode] = useState<'lots-buyers' | 'collectives'>('lots-buyers');
  const [collectives, setCollectives] = useState<FPOCollective[]>([]);
  const [showCreateCollectiveModal, setShowCreateCollectiveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCollectiveForInvite, setSelectedCollectiveForInvite] = useState<FPOCollective | null>(null);
  const [selectedFarmerToInviteDirect, setSelectedFarmerToInviteDirect] = useState<NetworkFarmer | null>(null);
  const [newCollectiveName, setNewCollectiveName] = useState('');
  const [newCollectiveCrop, setNewCollectiveCrop] = useState('Tomato');
  const [newCollectiveTargetVolume, setNewCollectiveTargetVolume] = useState<number | ''>(300);
  const [newCollectiveLocation, setNewCollectiveLocation] = useState(user.location || 'Lasalgaon, Nashik');
  const [newCollectiveDescription, setNewCollectiveDescription] = useState('');
  const [selectedInviteFarmerIds, setSelectedInviteFarmerIds] = useState<number[]>([]);
  const [creatingCollective, setCreatingCollective] = useState(false);
  const [invitingFarmer, setInvitingFarmer] = useState(false);
  const [collectiveActionMsg, setCollectiveActionMsg] = useState<string | null>(null);
  const [collectiveSearchQuery, setCollectiveSearchQuery] = useState('');

  // Invoice & Payment Settings States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Farmer UPI & Location Settings
  const [farmerUpiId, setFarmerUpiId] = useState(user.upi_id || '');
  const [farmerUpiName, setFarmerUpiName] = useState(user.upi_name || user.full_name || 'Farmer');
  const [farmLocation, setFarmLocation] = useState(user.location || '');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);
  const [pendingCodOrder, setPendingCodOrder] = useState<Order | null>(null);

  // Standard Verified APMC Commercial Crops (Data-Driven Preset)
  const STANDARD_CROPS = [
    { name: 'Tomato', variety: 'Hybrid Shivam Red', unit: 'Quintal', benchmark: 3500, packaging: 'Plastic Crates (25kg)', moisture: 12.0, defect: 2.0 },
    { name: 'Onion', variety: 'Nashik Garwa Red', unit: 'Quintal', benchmark: 2600, packaging: 'Jute Mesh Bags (50kg)', moisture: 10.5, defect: 1.8 },
    { name: 'Potato', variety: 'Kufri Jyoti / Pukhraj', unit: 'Quintal', benchmark: 2200, packaging: 'Jute Bags (50kg)', moisture: 14.0, defect: 2.5 },
    { name: 'Wheat', variety: 'Sharbati Golden', unit: 'Quintal', benchmark: 2700, packaging: 'Gunny Bags (50kg)', moisture: 11.0, defect: 1.0 },
    { name: 'Soybean', variety: 'Yellow High Protein', unit: 'Quintal', benchmark: 4500, packaging: 'Bags (50kg)', moisture: 10.0, defect: 1.5 },
    { name: 'Mango', variety: 'Alphonso / Banganapalli', unit: 'Quintal', benchmark: 6000, packaging: 'Corrugated Crates (10kg)', moisture: 13.0, defect: 2.0 },
    { name: 'Cotton', variety: 'Long Staple BT', unit: 'Quintal', benchmark: 7200, packaging: 'Pressed Bales (170kg)', moisture: 8.5, defect: 1.0 },
    { name: 'Maize', variety: 'Hybrid Yellow Corn', unit: 'Quintal', benchmark: 2150, packaging: 'PP Bags (50kg)', moisture: 12.5, defect: 2.2 }
  ];

  // Lot Form State (Data-Driven, No Blind Inputs)
  const [lotCropSourceMode, setLotCropSourceMode] = useState<'my-produce' | 'standard'>('my-produce');
  const [selectedProduceId, setSelectedProduceId] = useState<number | null>(null);
  const [lotCropName, setLotCropName] = useState('Tomato');
  const [lotVariety, setLotVariety] = useState('Hybrid Shivam Red');
  const [lotQuantity, setLotQuantity] = useState<number | ''>(75);
  const [lotUnit, setLotUnit] = useState('Quintal');
  const [lotPackaging, setLotPackaging] = useState('Plastic Crates (25kg)');
  const [lotBasePrice, setLotBasePrice] = useState<number | ''>(3400);
  const [lotHarvestDate, setLotHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [lotFpoName, setLotFpoName] = useState(user.farm_name ? `${user.farm_name} Co-op FPO` : 'Sahyadri Farmers Producer Co. Ltd');
  const [lotLocation, setLotLocation] = useState(user.location || 'Lasalgaon, Nashik');
  const [lotGrade, setLotGrade] = useState<QualityGrade>('Grade-A');
  const [lotMoisture, setLotMoisture] = useState<number>(12);
  const [lotDefect, setLotDefect] = useState<number>(2.0);
  const [lotColorUniformity, setLotColorUniformity] = useState<number>(95);
  const [lotCertifiedBy, setLotCertifiedBy] = useState('Agmark Quality Lab Nashik');
  const [creatingLot, setCreatingLot] = useState(false);

  // Digital Member Farmer Discovery & Pooling
  const [networkFarmers, setNetworkFarmers] = useState<NetworkFarmer[]>([]);
  const [loadingNetworkFarmers, setLoadingNetworkFarmers] = useState(false);
  const [farmerDirectoryTab, setFarmerDirectoryTab] = useState<'matching' | 'all'>('matching');
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [phoneLookupQuery, setPhoneLookupQuery] = useState('');
  const [phoneLookupError, setPhoneLookupError] = useState<string | null>(null);

  // Initial Multi-Farmer Collective
  const [lotMemberFarmers, setLotMemberFarmers] = useState<FPOMemberFarmer[]>([
    {
      farmer_id: user.id,
      farmer_name: `${user.full_name} (Lead Aggregator)`,
      farm_name: user.farm_name || `${user.full_name}'s Farm`,
      contributed_quantity: 40,
      unit: 'Quintal',
      farm_location: user.location || 'Lasalgaon, Nashik',
      phone: user.phone || '+91 98220 54321',
      is_lead: true
    }
  ]);

  // Requirements & Dispute actions
  const [acceptingReqId, setAcceptingReqId] = useState<string | null>(null);
  const [reqActionMsg, setReqActionMsg] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);
  const [acceptedWhatsAppUrl, setAcceptedWhatsAppUrl] = useState<string | null>(null);

  // Dispute form
  const [dispOrderId, setDispOrderId] = useState<string>('');
  const [dispSubject, setDispSubject] = useState('');
  const [dispDescription, setDispDescription] = useState('');
  const [submittingDisp, setSubmittingDisp] = useState(false);
  const [dispSuccessMsg, setDispSuccessMsg] = useState<string | null>(null);

  // Add Produce Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState<number | ''>('');
  const [harvestDate, setHarvestDate] = useState('');
  const [location, setLocation] = useState(user.location || '');
  const [description, setDescription] = useState('');
  const [organic, setOrganic] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Produce Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('kg');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editHarvestDate, setEditHarvestDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOrganic, setEditOrganic] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Live Mandi price lookup for produce being typed
  const [estimatedMandiPrice, setEstimatedMandiPrice] = useState<number | null>(null);
  const [mandiRateDetails, setMandiRateDetails] = useState<any | null>(null);
  const [mandiLoading, setMandiLoading] = useState(false);
  const [modalSelectedMandi, setModalSelectedMandi] = useState<string>('');

  // Delivery Agent Assignment Modal State
  const [assignAgentModalOrder, setAssignAgentModalOrder] = useState<Order | null>(null);
  const [agentNameInput, setAgentNameInput] = useState('');
  const [agentPhoneInput, setAgentPhoneInput] = useState('');
  const [agentVehicleInput, setAgentVehicleInput] = useState('');
  const [savingAgent, setSavingAgent] = useState(false);
  const [assignAgentSuccessMsg, setAssignAgentSuccessMsg] = useState<string | null>(null);

  const handleOpenAssignAgentModal = (order: Order) => {
    setAssignAgentModalOrder(order);
    setAgentNameInput(order.delivery_agent_assigned && order.driver_name ? order.driver_name : '');
    setAgentPhoneInput(order.delivery_agent_assigned && order.driver_phone ? order.driver_phone : '');
    setAgentVehicleInput(order.vehicle_number || '');
    setAssignAgentSuccessMsg(null);
  };

  const handleSaveDeliveryAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAgentModalOrder) return;
    if (!agentNameInput.trim()) {
      alert("Please enter Delivery Agent Full Name");
      return;
    }
    setSavingAgent(true);
    try {
      await api.assignDeliveryAgent(assignAgentModalOrder.id, {
        driver_name: agentNameInput.trim(),
        driver_phone: agentPhoneInput.trim() || user.phone || "+91 98210 00000",
        vehicle_number: agentVehicleInput.trim() || undefined
      });
      setMyOrders(prev => prev.map(o => o.id === assignAgentModalOrder.id ? {
        ...o,
        driver_name: agentNameInput.trim(),
        driver_phone: agentPhoneInput.trim() || o.driver_phone,
        vehicle_number: agentVehicleInput.trim() || o.vehicle_number,
        delivery_agent_assigned: true
      } : o));
      setAssignAgentSuccessMsg(`✓ Delivery Agent "${agentNameInput.trim()}" successfully assigned! Customer has received an instant popup alert.`);
      setTimeout(() => {
        setAssignAgentModalOrder(null);
        setAssignAgentSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err?.message || "Failed to assign delivery agent");
    } finally {
      setSavingAgent(false);
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      try {
        const saved = sessionStorage.getItem('farmiq_farmer_subtab');
        if (saved && saved !== activeSubTab && onSubTabChange) {
          onSubTabChange(saved);
        }
      } catch {}
      return;
    }
    if (activeSubTab && activeSubTab !== subTab) {
      setSubTab(activeSubTab);
      try {
        sessionStorage.setItem('farmiq_farmer_subtab', activeSubTab);
      } catch {}
    }
  }, [activeSubTab]);

  // Sync state whenever user profile is edited and saved
  useEffect(() => {
    if (user.location) {
      setLocation(user.location);
    }
  }, [user]);

  const loadFarmerData = async () => {
    try {
      setError(null);
      const [prods, orders, reqs, disps, lotsData, buyersData, networkData, collectivesData, contractsData] = await Promise.all([
        api.getFarmerProducts(),
        api.getFarmerOrders(),
        api.getRequirements().catch(() => []),
        api.getDisputes().catch(() => []),
        api.getLots().catch(() => []),
        api.getVerifiedBuyers().catch(() => []),
        api.getNetworkFarmers().catch(() => []),
        api.getFPOCollectives().catch(() => []),
        api.getContracts().catch(() => [])
      ]);
      setMyProducts(prods);
      setMyOrders(orders);
      setRequirements(reqs);
      setDisputes(disps);
      setLots(lotsData);
      setVerifiedBuyers(buyersData);
      setNetworkFarmers(networkData);
      setCollectives(collectivesData);
      setFarmerContracts(contractsData || []);

      // Check for Admin Approved Escrow contracts for this farmer (Escrow FPO Modal Guarantee popup)
      const approvedEscrowContract = (contractsData || []).find((c: any) =>
        (c.assigned_farmer_id === user.id || !c.assigned_farmer_id) &&
        c.admin_approval_status === 'APPROVED' &&
        c.escrow_status === 'HELD_IN_ESCROW' &&
        !sessionStorage.getItem('dismissed_fpo_modal_' + c.id)
      );
      if (approvedEscrowContract) {
        setFpoModalContract(approvedEscrowContract);
      }

      // Check for incoming COD orders awaiting farmer action
      const pendingCod = (orders || []).find((o: Order) =>
        o.status === 'ORDERED' &&
        (o.payment_method === 'Cash on Delivery' || o.payment_status === 'CASH_ON_DELIVERY') &&
        !sessionStorage.getItem('dismissed_cod_popup_' + o.id)
      );
      if (pendingCod) {
        setPendingCodOrder(pendingCod);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load farmer dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchContractProduce = async (contractId: string) => {
    try {
      await api.deliverContract(contractId);
      sessionStorage.setItem('dismissed_fpo_modal_' + contractId, 'true');
      setFpoModalContract(null);
      await loadFarmerData();
    } catch (err: any) {
      console.error("Failed to mark contract delivered:", err);
    }
  };

  const fetchNetworkFarmers = async (crop?: string) => {
    setLoadingNetworkFarmers(true);
    try {
      const data = await api.getNetworkFarmers(crop);
      setNetworkFarmers(data);
    } catch (e) {
      console.error('Failed to load network farmers:', e);
    } finally {
      setLoadingNetworkFarmers(false);
    }
  };

  useEffect(() => {
    if (showCreateLotModal) {
      fetchNetworkFarmers(lotCropName);
    }
  }, [showCreateLotModal, lotCropName]);

  const handleOpenCreateLotModal = () => {
    setShowCreateLotModal(true);
    setPhoneLookupError(null);
    setPhoneLookupQuery('');
    setFarmerSearchQuery('');
    setFarmerDirectoryTab('matching');

    // If farmer has active produce, auto-select the first one
    if (myProducts.length > 0) {
      handleSelectMyProduce(myProducts[0]);
    } else {
      handleSelectStandardCrop(STANDARD_CROPS[0]);
    }
  };

  const handleSelectMyProduce = (prod: Product) => {
    setSelectedProduceId(prod.id);
    setLotCropSourceMode('my-produce');
    setLotCropName(prod.name);
    setLotVariety(prod.description ? prod.description.slice(0, 35) : 'Farm Selected Harvest');
    const unit = prod.unit === 'kg' ? 'Quintal' : (prod.unit || 'Quintal');
    setLotUnit(unit);
    setLotLocation(prod.location || user.location || 'Lasalgaon, Nashik');
    
    // Suggested price based on produce price (convert kg to quintal if needed)
    const suggestedPrice = prod.price ? (prod.unit === 'kg' ? Math.round(prod.price * 85) : prod.price) : 3400;
    setLotBasePrice(suggestedPrice);

    // Initial lead farmer volume based on produce quantity
    const leadVolume = Math.min(Math.max(Number(prod.quantity) || 35, 10), 500);

    setLotMemberFarmers(prev => {
      const lead = prev[0] || {
        farmer_id: user.id,
        farmer_name: `${user.full_name} (Lead Aggregator)`,
        farm_name: user.farm_name || `${user.full_name}'s Farm`,
        farm_location: user.location || 'Lasalgaon, Nashik',
        phone: user.phone || '+91 98220 54321',
        is_lead: true
      };
      const updatedLead: FPOMemberFarmer = {
        ...lead,
        contributed_quantity: leadVolume,
        unit: unit,
        matched_crop_name: prod.name
      };
      const remaining = prev.slice(1);
      const updatedList = [updatedLead, ...remaining];
      const sum = updatedList.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
      setLotQuantity(sum);
      return updatedList;
    });
  };

  const handleSelectStandardCrop = (c: typeof STANDARD_CROPS[0]) => {
    setSelectedProduceId(null);
    setLotCropSourceMode('standard');
    setLotCropName(c.name);
    setLotVariety(c.variety);
    setLotUnit(c.unit);
    setLotPackaging(c.packaging);
    setLotBasePrice(c.benchmark);
    setLotMoisture(c.moisture);
    setLotDefect(c.defect);

    setLotMemberFarmers(prev => {
      const lead = prev[0] || {
        farmer_id: user.id,
        farmer_name: `${user.full_name} (Lead Aggregator)`,
        farm_name: user.farm_name || `${user.full_name}'s Farm`,
        farm_location: user.location || 'Lasalgaon, Nashik',
        phone: user.phone || '+91 98220 54321',
        is_lead: true
      };
      const updatedLead: FPOMemberFarmer = {
        ...lead,
        contributed_quantity: 40,
        unit: c.unit,
        matched_crop_name: c.name
      };
      const remaining = prev.slice(1);
      const updatedList = [updatedLead, ...remaining];
      const sum = updatedList.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
      setLotQuantity(sum);
      return updatedList;
    });
  };

  const handleAddFarmerToPool = (farmer: NetworkFarmer) => {
    if (lotMemberFarmers.some(mf => mf.farmer_id === farmer.id || mf.farmer_name.toLowerCase() === farmer.full_name.toLowerCase())) {
      alert(`${farmer.full_name} is already part of this pooled lot.`);
      return;
    }

    const defaultQty = farmer.matching_quantity && farmer.matching_quantity > 0 
      ? farmer.matching_quantity 
      : 25;

    const newMember: FPOMemberFarmer = {
      farmer_id: farmer.id,
      farmer_name: farmer.full_name,
      farm_name: farmer.farm_name,
      contributed_quantity: defaultQty,
      unit: lotUnit,
      farm_location: farmer.location,
      phone: farmer.phone,
      matched_crop_name: farmer.matching_crop_name || lotCropName,
      is_lead: false
    };

    const updated = [...lotMemberFarmers, newMember];
    setLotMemberFarmers(updated);
    const sum = updated.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
    setLotQuantity(sum);
  };

  const handleRemoveMemberFromPool = (indexToRemove: number) => {
    if (indexToRemove === 0) return; // Cannot remove lead farmer
    const updated = lotMemberFarmers.filter((_, idx) => idx !== indexToRemove);
    setLotMemberFarmers(updated);
    const sum = updated.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
    setLotQuantity(sum);
  };

  const handleUpdateMemberQuantity = (index: number, newQty: number) => {
    const updated = [...lotMemberFarmers];
    updated[index] = {
      ...updated[index],
      contributed_quantity: Math.max(1, newQty)
    };
    setLotMemberFarmers(updated);
    const sum = updated.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
    setLotQuantity(sum);
  };

  const handleLookupAndAddPhone = () => {
    setPhoneLookupError(null);
    const q = phoneLookupQuery.trim().toLowerCase();
    if (!q) {
      setPhoneLookupError("Please enter a phone number or farmer name to search");
      return;
    }
    const found = networkFarmers.find(f => 
      (f.phone && f.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))) ||
      f.full_name.toLowerCase().includes(q)
    );
    if (!found) {
      setPhoneLookupError(`No registered farmer found matching "${phoneLookupQuery}". Only verified FarmIQ network farmers can be added.`);
      return;
    }
    handleAddFarmerToPool(found);
    setPhoneLookupQuery('');
  };

  // FPO Collectives Handler Functions
  const handleCreateCollective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectiveName.trim() || !newCollectiveCrop.trim()) {
      alert('Please provide FPO Collective Name and Primary Focus Crop.');
      return;
    }
    setCreatingCollective(true);
    setCollectiveActionMsg(null);
    try {
      const res = await api.createFPOCollective({
        name: newCollectiveName.trim(),
        focus_crop: newCollectiveCrop.trim(),
        target_volume_quintal: Number(newCollectiveTargetVolume) || 250,
        location: newCollectiveLocation.trim() || user.location || 'Regional Cluster',
        description: newCollectiveDescription.trim(),
        invited_farmer_ids: selectedInviteFarmerIds
      });

      setShowCreateCollectiveModal(false);
      setNewCollectiveName('');
      setNewCollectiveDescription('');
      setSelectedInviteFarmerIds([]);
      setCollectiveActionMsg(`🎉 FPO Collective "${res.collective.name}" formed successfully! Invitations delivered.`);
      await loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to form FPO Collective.');
    } finally {
      setCreatingCollective(false);
    }
  };

  const handleInviteFarmerToCollective = async (collectiveId: string, farmerId: number) => {
    setInvitingFarmer(true);
    setCollectiveActionMsg(null);
    try {
      const res = await api.inviteFarmerToFPO(collectiveId, farmerId);
      setCollectiveActionMsg(res.message);
      setShowInviteModal(false);
      setSelectedCollectiveForInvite(null);
      setSelectedFarmerToInviteDirect(null);
      await loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation');
    } finally {
      setInvitingFarmer(false);
    }
  };

  const handleRespondToCollectiveInvite = async (collectiveId: string, action: 'accept' | 'decline') => {
    try {
      const res = await api.respondToFPOInvite(collectiveId, action);
      setCollectiveActionMsg(res.message);
      await loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to update invitation response');
    }
  };

  const handleAssembleLotFromCollective = (col: FPOCollective) => {
    // Switch to lots-buyers view and open Create Lot Modal prefilled with this collective
    setFpoViewMode('lots-buyers');
    setLotFpoName(col.name);
    setLotCropName(col.focus_crop);
    setLotLocation(col.location || user.location || 'Lasalgaon, Nashik');
    
    // Map accepted members into lotMemberFarmers
    const acceptedMembers = (col.members || []).filter(m => m.status === 'ACCEPTED');
    if (acceptedMembers.length > 0) {
      const mapped: FPOMemberFarmer[] = acceptedMembers.map((m) => ({
        farmer_id: m.farmer_id,
        farmer_name: m.farmer_name,
        farm_name: `${m.farmer_name}'s Farm`,
        contributed_quantity: m.contributed_quantity || Math.round(col.target_volume_quintal / acceptedMembers.length),
        unit: m.unit || 'Quintal',
        farm_location: m.farm_location || col.location,
        phone: m.phone,
        is_lead: m.farmer_id === col.lead_farmer_id
      }));
      setLotMemberFarmers(mapped);
      const totalQty = mapped.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
      setLotQuantity(totalQty);
    }
    setShowCreateLotModal(true);
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotCropName.trim() || !lotQuantity || !lotBasePrice) {
      alert('Please fill crop name, quantity, and base price.');
      return;
    }
    if (!lotMemberFarmers || lotMemberFarmers.length < 2) {
      alert('FPO Cooperative Rule: An FPO produce lot requires at least 2 verified farmers combining their harvest. Please add at least 1 other registered farmer from the network.');
      return;
    }
    setCreatingLot(true);
    setMatchingSuccessMsg(null);
    try {
      const res = await api.createLot({
        crop_name: lotCropName.trim(),
        variety: lotVariety.trim() || 'Standard Commercial Variety',
        quantity: Number(lotQuantity),
        unit: lotUnit,
        packaging_type: lotPackaging,
        base_price_per_unit: Number(lotBasePrice),
        harvest_date: lotHarvestDate,
        location: lotLocation,
        fpo_name: lotFpoName,
        quality_grade: lotGrade,
        moisture_pct: Number(lotMoisture),
        defect_pct: Number(lotDefect),
        color_uniformity_pct: Number(lotColorUniformity),
        certified_by: lotCertifiedBy,
        member_farmers: lotMemberFarmers
      });

      setShowCreateLotModal(false);
      setMatchingSuccessMsg(`Lot #${res.lot.id} successfully created with ${res.lot.quality_grade} quality grading and ${lotMemberFarmers.length} pooled farmers! Matching verified institutional buyers are shown below.`);
      await loadFarmerData();
      setSelectedLotForMatch(res.lot);
    } catch (err: any) {
      alert(err.message || 'Failed to create produce lot');
    } finally {
      setCreatingLot(false);
    }
  };

  const handleMatchLotWithBuyer = async (lotId: string, buyerId: string) => {
    setMatchingLotId(lotId);
    setMatchingSuccessMsg(null);
    try {
      const res = await api.matchLotWithBuyer(lotId, buyerId);
      const orderNum = res.order?.id ? `Order #${res.order.id}` : 'Order';
      setMatchingSuccessMsg(`🎉 Success! Escrow Contract activated with ${res.contract?.buyer_name || 'Buyer'}. ${orderNum} created — you can now click "Prepare Order" below or in the Orders tab!`);
      
      // Optimistic update
      if (res.order) {
        setMyOrders(prev => [res.order, ...prev.filter(o => o.id !== res.order.id)]);
      }
      setLots(prev => prev.map(l => l.id === lotId ? {
        ...l,
        status: 'CONTRACTED',
        matched_buyer_name: res.contract?.buyer_name || 'Verified Buyer',
        linked_order_id: res.order?.id,
        fulfillment_status: 'ACCEPTED'
      } : l));

      try {
        const bus = new BroadcastChannel('farmiq_bus');
        bus.postMessage({ type: 'LOT_MATCHED', order: res.order, lot: res.lot, contract: res.contract });
        bus.close();
      } catch {}
      window.dispatchEvent(new CustomEvent('farmiq_state_change', { detail: { type: 'LOT_MATCHED', order: res.order } }));

      await loadFarmerData();
      if (selectedLotForMatch && selectedLotForMatch.id === lotId) {
        setSelectedLotForMatch(prev => prev ? { 
          ...prev, 
          status: 'CONTRACTED', 
          matched_buyer_name: res.contract?.buyer_name,
          linked_order_id: res.order?.id,
          fulfillment_status: 'ACCEPTED'
        } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to lock contract with verified buyer');
    } finally {
      setMatchingLotId(null);
    }
  };

  useEffect(() => {
    loadFarmerData();

    // 1. Cross-tab & local real-time sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('farmiq_bus');
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_COD_ORDER' && event.data.order) {
          setPendingCodOrder(event.data.order);
        }
        if (event.data?.type) {
          loadFarmerData();
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }

    // 2. Server-Sent Events (SSE) for instant server pushes
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/notifications/stream');
      evtSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === 'NEW_COD_ORDER' && parsed.data?.order) {
            setPendingCodOrder(parsed.data.order);
          }
          if (parsed && (parsed.type || parsed.data)) {
            loadFarmerData();
          }
        } catch {
          // heartbeat
        }
      };
      evtSource.onerror = () => {
        // SSE auto-reconnects
      };
    } catch {
      // SSE unsupported fallback
    }

    // 3. In-window custom event listener
    const handleLocalSync = () => {
      loadFarmerData();
    };
    window.addEventListener('farmiq_state_change', handleLocalSync);

    // 4. Polling fallback (4s)
    const interval = setInterval(loadFarmerData, 4000);

    return () => {
      clearInterval(interval);
      if (evtSource) evtSource.close();
      if (bc) bc.close();
      window.removeEventListener('farmiq_state_change', handleLocalSync);
    };
  }, []);

  const handleAcceptRequirement = async (reqId: string) => {
    setAcceptingReqId(reqId);
    setReqActionMsg(null);
    try {
      const res = await api.acceptRequirement(reqId);
      setReqActionMsg(`Requirement #${reqId} claimed! Order #${res.order?.id || ''} has been added to your Incoming Orders queue for packaging & dispatch.`);
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept requirement');
    } finally {
      setAcceptingReqId(null);
    }
  };

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispSubject.trim() || !dispDescription.trim()) return;
    setSubmittingDisp(true);
    setDispSuccessMsg(null);
    try {
      const res = await api.fileDispute({
        order_id: dispOrderId ? Number(dispOrderId) : null,
        subject: dispSubject.trim(),
        description: dispDescription.trim()
      });
      setDispSuccessMsg(`Farmer Grievance #${res.id} filed with Admin. Escrow team will review immediately.`);
      setDispSubject('');
      setDispDescription('');
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to file grievance');
    } finally {
      setSubmittingDisp(false);
    }
  };

  // Calculate Mandi benchmark when typing crop name or updating location or market
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      setMandiLoading(true);
      const timer = setTimeout(() => {
        api.getMandiPrices({
          crop: trimmed,
          location: location.trim() || undefined,
          mandi: modalSelectedMandi || undefined,
          lat: user?.latitude,
          lng: user?.longitude
        })
          .then(res => {
            if (res.mandi_prices && res.mandi_prices.length > 0) {
              setEstimatedMandiPrice(res.mandi_prices[0].modal_price);
              setMandiRateDetails(res.mandi_prices[0]);
            } else {
              setEstimatedMandiPrice(null);
              setMandiRateDetails(null);
            }
          })
          .catch(() => {
            setEstimatedMandiPrice(null);
            setMandiRateDetails(null);
          })
          .finally(() => {
            setMandiLoading(false);
          });
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setEstimatedMandiPrice(null);
      setMandiRateDetails(null);
      setMandiLoading(false);
    }
  }, [name, location, modalSelectedMandi]);

  // Handle local image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Unit conversion helper for Mandi rates
  const getUnitMandiCeiling = (baseModalKg: number | null | undefined, unitType: string) => {
    if (!baseModalKg) return null;
    const clean = (unitType || 'kg').toLowerCase().trim();
    if (clean.includes('quintal') || clean === 'qtl') return baseModalKg * 100;
    if (clean.includes('ton') || clean.includes('tonne')) return baseModalKg * 1000;
    if (clean.includes('box') || clean.includes('crate')) return baseModalKg * 20;
    if (clean.includes('dozen')) return Math.round(baseModalKg * 1.5);
    return baseModalKg;
  };

  // Submit Produce
  const handleAddProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity || !price) {
      alert('Please fill in crop name, quantity, and price per unit.');
      return;
    }

    const currentCeiling = getUnitMandiCeiling(mandiRateDetails?.modal_price, unit);
    if (currentCeiling && Number(price) > currentCeiling) {
      alert(`Cannot accept product: Your entered price of ₹${price}/${unit} exceeds the official Mandi benchmark rate of ₹${currentCeiling}/${unit} (at ${mandiRateDetails?.mandi || 'APMC'}). The platform does not accept produce listed above the official Mandi rate.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.createProduct({
        name: name.trim(),
        category,
        quantity: Number(quantity),
        unit,
        price: Number(price),
        harvest_date: harvestDate,
        location: location.trim(),
        description: description.trim(),
        organic,
        image_base64: imageBase64,
      });

      setShowAddModal(false);
      // Reset form with NO predefined dummy values
      setName('');
      setCategory('');
      setQuantity('');
      setUnit('kg');
      setPrice('');
      setHarvestDate('');
      setLocation(user.location || '');
      setDescription('');
      setOrganic(false);
      setImagePreview(null);
      setImageBase64(null);
      setEstimatedMandiPrice(null);
      setMandiRateDetails(null);
      
      onProduceAdded();
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to list produce');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setName('');
    setCategory('');
    setQuantity('');
    setUnit('kg');
    setPrice('');
    setHarvestDate('');
    setLocation(user.location || '');
    setDescription('');
    setOrganic(false);
    setImagePreview(null);
    setImageBase64(null);
    setEstimatedMandiPrice(null);
    setMandiRateDetails(null);
  };

  // Delete product permanently
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this listing? It will be completely removed from the platform.')) return;
    try {
      // Optimistic removal from state
      setMyProducts(prev => prev.filter(p => p.id !== id));
      await api.deleteProduct(id);
      await loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing');
      await loadFarmerData();
    }
  };

  // Farmer accepts or rejects Cash on Delivery order
  const handleCodAction = async (orderId: number, accept: boolean) => {
    setUpdatingOrderId(orderId);
    try {
      await api.codOrderAction(orderId, accept);
      sessionStorage.setItem('dismissed_cod_popup_' + orderId, 'true');
      setPendingCodOrder(null);
      if (accept) {
        setOrderNotification(`🎉 COD Order #${orderId} accepted! Order moved directly to PREPARING.`);
      } else {
        setOrderNotification(`COD Order #${orderId} rejected. Customer notified with zero payment deduction.`);
      }
      await loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to process COD order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Open edit modal prefilled with product data
  const handleEditProduct = (p: any) => {
    setEditingProduct(p);
    setEditName(p.name || '');
    setEditCategory(p.category || '');
    setEditQuantity(p.quantity || '');
    setEditUnit(p.unit || 'kg');
    setEditPrice(p.price || '');
    setEditHarvestDate(p.harvest_date || '');
    setEditLocation(p.location || user.location || '');
    setEditDescription(p.description || '');
    setEditOrganic(p.organic === 1);
    setEditImagePreview(p.image_url || null);
    setEditImageBase64(null);
  };

  // Submit product edit
  const handleUpdateProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim() || !editQuantity || !editPrice) {
      alert('Please fill in crop name, quantity, and price.');
      return;
    }
    setEditSubmitting(true);
    try {
      await api.updateProduct(editingProduct.id, {
        name: editName.trim(),
        category: editCategory,
        quantity: Number(editQuantity),
        unit: editUnit,
        price: Number(editPrice),
        harvest_date: editHarvestDate,
        location: editLocation.trim(),
        description: editDescription.trim(),
        organic: editOrganic,
        image_base64: editImageBase64,
      });
      setEditingProduct(null);
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to update listing');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditImagePreview(result);
      setEditImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // View linked invoice for confirmed or paid order
  const handleOpenInvoiceModal = async (order: Order) => {
    try {
      const inv = await api.getOrderInvoice(order.id);
      setSelectedInvoice(inv);
      setSelectedInvoiceOrder(order);
      setIsInvoiceModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load invoice');
    }
  };

  // Farmer accepts incoming order -> auto generates invoice & notifies customer with Track, Pay & Invoice options
  const handleAcceptOrder = async (orderId: number) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.acceptOrder(orderId);
      const custWaUrl = res.customer_whatsapp_url || (res.order && res.order.customer_whatsapp_url);
      setAcceptedWhatsAppUrl(custWaUrl || null);
      setOrderNotification(`🎉 Order #${orderId} accepted! Commercial Tax Invoice #${res.invoice?.invoice_number || 'GENERATED'} created. Customer received WhatsApp message with direct options to Track Order, Pay via UPI, and View Invoice.`);
      await loadFarmerData();
    } catch (err: any) {
      setAcceptedWhatsAppUrl(null);
      setOrderNotification(`⚠️ ${err.message || 'Failed to accept order'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Farmer rejects incoming order -> restores stock & notifies customer
  const handleRejectOrder = async (orderId: number) => {
    const reason = window.prompt('Please enter a reason for rejecting this order (optional):', 'Harvest stock unavailable or committed to APMC');
    if (reason === null) return;
    setUpdatingOrderId(orderId);
    try {
      await api.rejectOrder(orderId, reason);
      setOrderNotification(`Order #${orderId} was rejected.`);
      await loadFarmerData();
    } catch (err: any) {
      setOrderNotification(`⚠️ ${err.message || 'Failed to reject order'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Save payment & farm settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveMsg(null);
    try {
      const res = await api.updateProfile({
        upi_id: farmerUpiId.trim(),
        upi_name: farmerUpiName.trim(),
        location: farmLocation.trim(),
      });
      if (res.user) {
        setStoredUser(res.user);
      }
      setSettingsSaveMsg('✓ Payment UPI ID & Farm pickup details updated successfully!');
    } catch (err: any) {
      setSettingsSaveMsg(`⚠️ ${err.message || 'Failed to update settings'}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Update order status with optimistic sync and notification
  const handleStatusUpdate = async (orderId: number, nextStatus: string, extraData?: { driver_name?: string | null; driver_phone?: string | null; vehicle_number?: string | null }) => {
    // Check if moving to PREPARING or TRANSIT without payment/COD
    if (nextStatus === 'PREPARING' || nextStatus === 'TRANSIT') {
      const targetOrder = myOrders.find(o => o.id === orderId);
      if (targetOrder) {
        const isPaid = targetOrder.payment_status === 'PAID' || targetOrder.status === 'PAID' || targetOrder.payment_status === 'LOCKED_IN_ESCROW';
        const isCod = targetOrder.payment_method === 'Cash on Delivery' || targetOrder.payment_status === 'CASH_ON_DELIVERY';
        if (!isPaid && !isCod) {
          alert('Customer payment or Cash on Delivery confirmation is required before preparing or transiting this order.');
          return;
        }
      }
    }

    setUpdatingOrderId(orderId);
    setOrderNotification(null);
    // Optimistic UI updates across orders and lots
    setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any, ...(extraData || {}) } : o));
    setLots(prev => prev.map(l => (l.linked_order_id === orderId || (l as any).id === orderId) ? { ...l, fulfillment_status: nextStatus as any } : l));
    
    try {
      await api.updateOrderStatus(orderId, nextStatus, extraData);
      const label = nextStatus === 'PREPARING' ? 'Packing & Preparation in progress' :
                    nextStatus === 'TRANSIT' ? 'Handed over to Transit' :
                    nextStatus === 'DELIVERED' ? 'Delivered & Escrow released' : 'Updated';
      setOrderNotification(`✓ Order #${orderId}: ${label}!`);
      await loadFarmerData();
    } catch (err: any) {
      setOrderNotification(`⚠️ ${err.message || 'Failed to update order status'}`);
      await loadFarmerData();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePrepareOrderForLot = (lot: FPOLot) => {
    const linked = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
    if (linked) {
      handleStatusUpdate(linked.id, 'PREPARING');
    } else if (lot.linked_order_id) {
      handleStatusUpdate(lot.linked_order_id, 'PREPARING');
    }
  };

  const promptDriverDetails = (): { driver_name?: string | null; driver_phone?: string | null; vehicle_number?: string | null } | null => {
    const driverInput = window.prompt("Enter Delivery Driver / Transporter name (optional - click OK or Leave Blank for Direct Farm Dispatch):", "");
    if (driverInput === null) return null; // user clicked Cancel
    const dName = driverInput.trim();
    let dPhone: string | null = null;
    let vNum: string | null = null;
    if (dName) {
      const p = window.prompt("Enter Driver Phone Number (optional):", "");
      if (p && p.trim()) dPhone = p.trim();
      const v = window.prompt("Enter Vehicle Number (optional):", "");
      if (v && v.trim()) vNum = v.trim();
    }
    return {
      driver_name: dName || null,
      driver_phone: dPhone,
      vehicle_number: vNum
    };
  };

  const handleDispatchOrderForLot = (lot: FPOLot) => {
    const driverDetails = promptDriverDetails();
    if (driverDetails === null) return;
    const linked = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
    if (linked) {
      handleStatusUpdate(linked.id, 'TRANSIT', driverDetails);
    } else if (lot.linked_order_id) {
      handleStatusUpdate(lot.linked_order_id, 'TRANSIT', driverDetails);
    }
  };

  const handleDeliverOrderForLot = (lot: FPOLot) => {
    const linked = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
    if (linked) {
      handleStatusUpdate(linked.id, 'DELIVERED');
    } else if (lot.linked_order_id) {
      handleStatusUpdate(lot.linked_order_id, 'DELIVERED');
    }
  };

  // Aggregates
  const totalAvailableQty = myProducts.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalEarnings = myOrders.reduce((acc, o) => (o.status !== 'CANCELLED' && o.status !== 'REJECTED') ? acc + (o.grand_total || ((o.product_total || 0) + (o.delivery_charge || 0))) : acc, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-md mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-[11px] font-bold tracking-wider uppercase">
              {tr('Farmer Dashboard', language)}
            </span>
            <span className="text-emerald-200 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {user.location}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 font-['Outfit']">
            {user.full_name}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 font-medium">
            {tr('Farm Name / Brand', language)}: {user.farm_name || 'Direct Agro Farm'} • {tr('Phone Number', language)}: {user.phone}
          </p>
        </div>

        <button
          id="btn-add-produce"
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-lg shadow-black/10 flex items-center gap-2 hover:bg-emerald-50 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-700" />
          <span>{t.addProduce}</span>
        </button>
      </div>

      {/* Escrow FPO Guarantee Alert Banner */}
      {farmerContracts.filter(c => c.admin_approval_status === 'APPROVED' && (c.escrow_status === 'HELD_IN_ESCROW' || c.escrow_status === 'DELIVERY_CONFIRMED')).map(c => (
        <div key={`escrow-banner-${c.id}`} className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white border-2 border-emerald-400 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  FPO Escrow Protected
                </span>
                <span className="text-xs text-emerald-300 font-mono">
                  Contract #{c.id} • UTR: {c.escrow_deposit_ref || 'ICICI-ESC-CONFIRMED'}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                {c.buyer_name} Escrow Locked: ₹{c.total_amount.toLocaleString()} Vault Safe
              </h4>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Admin approved buyer's funds into ICICI Escrow. Your payment is 100% guaranteed upon dispatch of {c.quantity} {c.unit} {c.commodity}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFpoModalContract(c)}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-900 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4 text-stone-900" />
              <span>View FPO Guarantee & Dispatch</span>
            </button>
          </div>
        </div>
      ))}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">{tr('Active Listings', language)}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{myProducts.length}</span>
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{tr('Available on marketplace', language)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">{tr('Total Available Quantity', language)}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{totalAvailableQty} <span className="text-sm font-normal text-stone-500">{translateUnit('kg', language)}</span></span>
            <Leaf className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{tr('Ready for direct pickup', language)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">{tr('Incoming Orders', language)}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{myOrders.length}</span>
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{myOrders.filter(o => o.status === 'ORDERED').length} {tr('need acceptance', language)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">{tr('Total Farm Revenue', language)}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-800">₹{totalEarnings}</span>
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{tr('100% direct realization (Produce + Delivery fees)', language)}</p>
        </div>
      </div>

      {/* Sub-tabs: My Produce, FPO Lots & Verified Buyers, Orders, Buyer Requirements, Disputes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 mb-6 gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => handleSwitchSubTab('my-produce')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'my-produce' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.myProduce} ({myProducts.length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('fpo-lots')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'fpo-lots' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>{tr('FPO & Collectives', language)} ({lots.length + collectives.length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('farmer-orders')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'farmer-orders' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.incomingOrders} ({myOrders.length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('buyer-requirements')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'buyer-requirements' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FilePlus className="w-4 h-4 text-emerald-600" />
            <span>{tr('Buyer Requirements', language)} ({requirements.filter(r => r.status === 'OPEN').length} Open)</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('disputes')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'disputes' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{tr('Disputes & Grievances', language)} ({disputes.length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('payment-settings')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'payment-settings' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Payment & Farm Settings</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <Leaf className="w-3.5 h-3.5" />
          <span>Multi-Device Sync Active: Instant inventory updates</span>
        </div>
      </div>

      {/* SUB-TAB 1: MY PRODUCE */}
      {subTab === 'my-produce' && (
        <div>
          {myProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 mb-1">You haven't listed any produce yet.</h3>
              <p className="text-xs text-stone-500 mb-6">
                Upload your harvest photo, set your price, check the live Mandi rate, and sell directly to consumers.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800 transition"
              >
                + {t.addProduce}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {myProducts.map((p) => {
                const mandiDiff = (p.price || 0) - (p.market_price || 0);
                const isBelowMandi = mandiDiff < 0;

                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      {/* Product Image */}
                      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                            {p.category}
                          </span>
                          {p.organic === 1 && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Leaf className="w-3 h-3" /> Organic
                            </span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <button
                            onClick={() => handleEditProduct(p)}
                            title="Edit Listing"
                            className="p-1.5 rounded-full bg-white/90 text-stone-500 hover:text-emerald-700 hover:bg-white transition shadow-xs"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Listing"
                            className="p-1.5 rounded-full bg-white/90 text-stone-500 hover:text-red-600 hover:bg-white transition shadow-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                          <div className="text-right">
                            <span className="text-xl font-bold text-emerald-800">₹{p.price}</span>
                            <span className="text-xs text-stone-500">/{p.unit}</span>
                          </div>
                        </div>

                        {/* Mandi Comparison Highlight (Requested feature) */}
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 mb-3 text-xs">
                          <div className="flex items-center justify-between font-semibold text-amber-950 mb-1">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                              Mandi Benchmark:
                            </span>
                            <span className="font-bold">₹{p.market_price || 35}/{p.unit}</span>
                          </div>
                          {(p.mandi_name || p.location) && (
                            <p className="text-[10px] text-stone-600 mb-1 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="font-medium">@ {p.mandi_name || 'Local APMC'} {p.mandi_district ? `(${p.mandi_district})` : ''}</span>
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-stone-600">
                            <span>Price Difference:</span>
                            <span className={`font-bold ${isBelowMandi ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {isBelowMandi ? `₹${Math.abs(mandiDiff)} below Mandi (High Demand!)` : `₹${mandiDiff} above Mandi`}
                            </span>
                          </div>
                        </div>

                        {/* Shelf-Life & Preservation Advisor */}
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/70 mb-3 text-xs text-blue-950">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-700" />
                              Preservation:
                            </span>
                            <span className="text-[11px] font-bold text-blue-800">
                              {p.remaining_shelf_life ?? 12} days left
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-600 leading-tight">
                            {p.harvest_timing === 'FUTURE' || (p.days_until_harvest && p.days_until_harvest > 0) ? (
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600 inline" />
                                Scheduled Harvest: {p.harvest_date} ({p.days_until_harvest === 1 ? 'Tomorrow' : p.days_until_harvest === 2 ? 'Day After Tomorrow' : `In ${p.days_until_harvest} days`}) • 0 days stored
                              </span>
                            ) : p.days_since_harvest === 0 ? (
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600 inline" />
                                Freshly Harvested Today: {p.harvest_date} • 0 days stored
                              </span>
                            ) : (
                              <span>
                                Harvested: {p.harvest_date} • Stored for {p.days_since_harvest} {p.days_since_harvest === 1 ? 'day' : 'days'}.
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-blue-800 font-medium mt-1">
                            💡 {p.action_advice || 'Mandi prices fluctuate; store in cold hub if holding for surge.'}
                          </p>
                        </div>

                        {/* Quantity & Location */}
                        <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-100">
                          <span className="font-semibold">Stock: {p.quantity} {p.unit}</span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-stone-400" /> {p.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom storage recommendation action */}
                    {onNavigateToStorage && (
                      <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500 text-[11px]">Need cold storage?</span>
                        <button
                          onClick={onNavigateToStorage}
                          className="text-emerald-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
                        >
                          Book Space (₹4.5/Q) <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: FPO LOTS & VERIFIED BUYERS */}
      {subTab === 'fpo-lots' && (
        <div className="space-y-6 text-left">
          {matchingSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{matchingSuccessMsg}</span>
              </div>
              <button onClick={() => setMatchingSuccessMsg(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>
          )}

          {/* Tab Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-teal-900 via-emerald-900 to-emerald-800 p-6 rounded-2xl text-white shadow-sm">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Institutional FPO Marketplace</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-['Outfit']">FPO Graded Lots & Verified Buyers</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Aggregate farm produce into commercial graded lots. Connect directly with institutional buyers (retail chains, processors, exporters) verified & approved by FarmiQ Admin with 100% Escrow security.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadFarmerData}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              {fpoViewMode === 'lots-buyers' ? (
                <button
                  onClick={handleOpenCreateLotModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Produce Lot</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateCollectiveModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Form FPO Collective</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-navigation tabs: Lots & Buyers vs. Farmer Collectives */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-2">
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setFpoViewMode('lots-buyers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  fpoViewMode === 'lots-buyers'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-4 h-4 text-emerald-700" />
                <span>FPO Graded Lots & Buyers ({lots.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFpoViewMode('collectives')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  fpoViewMode === 'collectives'
                    ? 'bg-white text-teal-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="w-4 h-4 text-teal-700" />
                <span>🤝 Connect Farmers & FPO Collectives ({collectives.length})</span>
                {collectives.filter(c => c.members?.some(m => m.farmer_id === user.id && m.status === 'INVITED')).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-bounce">
                    {collectives.filter(c => c.members?.some(m => m.farmer_id === user.id && m.status === 'INVITED')).length} Pending Invites
                  </span>
                )}
              </button>
            </div>

            {fpoViewMode === 'collectives' && (
              <button
                type="button"
                onClick={() => setShowCreateCollectiveModal(true)}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Form New FPO Collective</span>
              </button>
            )}
          </div>

          {fpoViewMode === 'lots-buyers' && (
            <div className="space-y-6">
              {/* Active Lot Matching Focus Banner */}
              {selectedLotForMatch && (
            <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-500 text-teal-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-teal-200/80 px-2 py-0.5 rounded text-teal-900">Matching Mode Active</span>
                    <span className="text-xs font-mono font-bold text-teal-800">#{selectedLotForMatch.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                    {selectedLotForMatch.quantity} {selectedLotForMatch.unit} of {selectedLotForMatch.crop_name} ({selectedLotForMatch.variety}) - {selectedLotForMatch.quality_grade}
                  </h4>
                  <p className="text-xs text-stone-600">
                    Base Valuation: ₹{selectedLotForMatch.base_price_per_unit} / {selectedLotForMatch.unit} • Total: ₹{(selectedLotForMatch.quantity * selectedLotForMatch.base_price_per_unit).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLotForMatch(null)}
                className="px-3 py-1.5 rounded-lg border border-teal-300 text-xs font-bold text-teal-900 hover:bg-teal-100 transition self-start sm:self-auto cursor-pointer"
              >
                Exit Match Mode
              </button>
            </div>
          )}

          {/* LOTS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-stone-900">Active FPO Produce Lots ({lots.length})</h4>
                <p className="text-xs text-stone-500">Commercial grade lots aggregated for institutional procurement</p>
              </div>
            </div>

            {lots.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-stone-300 max-w-xl mx-auto">
                <Building2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-stone-800">No FPO lots listed yet</h4>
                <p className="text-xs text-stone-500 mt-1 mb-4">
                  Create your first quality-graded produce lot to receive bids and matching contracts from verified retail buyers.
                </p>
                <button
                  onClick={handleOpenCreateLotModal}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
                >
                  + Create First Produce Lot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {lots.map((lot) => {
                  const isSelected = selectedLotForMatch?.id === lot.id;
                  const totalValue = (lot.quantity || 0) * (lot.base_price_per_unit || 0);

                  return (
                    <div
                      key={lot.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                        isSelected 
                          ? 'border-teal-600 ring-2 ring-teal-200' 
                          : 'border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Meta */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-800">#{lot.id}</span>
                            <span className="text-[11px] text-stone-500 font-medium">{lot.fpo_name}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            lot.status === 'AVAILABLE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            ● {lot.status}
                          </span>
                        </div>

                        {/* Title & Quantity */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-stone-900">
                              {lot.quantity} {lot.unit} of {lot.crop_name}
                            </h4>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                              {lot.quality_grade}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5 font-medium">
                            Variety: {lot.variety} • Packaging: {lot.packaging_type}
                          </p>
                        </div>

                        {/* Quality Specs Pill Grid */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-stone-700">
                            <span className="font-semibold flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-emerald-600" /> Lab Certification:
                            </span>
                            <span className="font-medium text-emerald-800">{lot.certified_by}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-200/60 text-center">
                            <div className="bg-white p-2 rounded-lg border border-stone-200">
                              <p className="text-[10px] text-stone-500">Moisture</p>
                              <p className="text-xs font-bold text-stone-800">{lot.moisture_pct}%</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-stone-200">
                              <p className="text-[10px] text-stone-500">Defect Rate</p>
                              <p className="text-xs font-bold text-stone-800">&lt; {lot.defect_pct}%</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-stone-200">
                              <p className="text-[10px] text-stone-500">Color Uniformity</p>
                              <p className="text-xs font-bold text-emerald-800">{lot.color_uniformity_pct}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Multi-Farmer Pooled Produce (2+ Farmers Combined) */}
                        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-amber-700" />
                              FPO Pooled Collective ({lot.member_farmers?.length || 2} Farmers Combined)
                            </span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                              Cooperative Aggregation
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            {lot.member_farmers && lot.member_farmers.length > 0 ? (
                              lot.member_farmers.map((mf, fIdx) => {
                                const share = mf.share_pct || (lot.quantity ? Math.round(((mf.contributed_quantity / lot.quantity) * 100)) : 0);
                                const payout = mf.payout_amount || Math.round(mf.contributed_quantity * (lot.base_price_per_unit || 0));
                                return (
                                  <div key={fIdx} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-amber-100 shadow-2xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[9px] font-bold">
                                        {fIdx + 1}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-1">
                                          <span className="font-semibold text-stone-800">{mf.farmer_name}</span>
                                          {mf.is_lead && (
                                            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">Lead</span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-stone-400">
                                          {mf.farm_name ? `${mf.farm_name} • ` : ''}📍 {mf.farm_location || 'Local Cluster'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="font-bold text-emerald-800 text-xs">
                                        {mf.contributed_quantity} {mf.unit || lot.unit} <span className="text-[10px] text-stone-500 font-normal">({share}%)</span>
                                      </div>
                                      <div className="text-[9px] text-stone-400">
                                        Est. Payout: ₹{payout.toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-[10px] text-stone-400 text-center py-1">
                                Member farmer details not recorded
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pricing and Location */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div>
                            <span className="text-stone-500">Base Price: </span>
                            <strong className="text-sm font-bold text-emerald-800">₹{lot.base_price_per_unit}</strong>
                            <span className="text-stone-500"> / {lot.unit}</span>
                            <span className="text-[11px] text-stone-400 block">(Est. Lot Value: ₹{totalValue.toLocaleString('en-IN')})</span>
                          </div>
                          <div className="text-right text-stone-600 text-[11px]">
                            <p className="flex items-center justify-end gap-1"><MapPin className="w-3 h-3 text-stone-400" /> {lot.location}</p>
                            <p className="text-stone-400 mt-0.5">Harvest: {lot.harvest_date}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="pt-4 mt-3 border-t border-stone-100">
                        {lot.status === 'AVAILABLE' ? (
                          <button
                            onClick={() => setSelectedLotForMatch(isSelected ? null : lot)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                              isSelected 
                                ? 'bg-teal-700 text-white' 
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>{isSelected ? '✓ Matching Active (See Buyers Below)' : 'Match with Verified Institutional Buyers'}</span>
                          </button>
                        ) : (() => {
                          const linkedOrder = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
                          const orderStatus = linkedOrder?.status || lot.fulfillment_status || 'ACCEPTED';
                          const orderId = linkedOrder?.id || lot.linked_order_id;
                          const isUpdating = updatingOrderId === orderId;

                          return (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 font-semibold">
                                <div className="flex items-center gap-1.5 truncate mr-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="truncate">Contracted with {lot.matched_buyer_name || 'Verified Buyer'}</span>
                                </div>
                                <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-950 font-bold uppercase shrink-0">
                                  Escrow Secured
                                </span>
                              </div>

                              {/* Interactive Order Preparation Stepper */}
                              {orderStatus === 'ACCEPTED' && (
                                <button
                                  onClick={() => handlePrepareOrderForLot(lot)}
                                  disabled={isUpdating}
                                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-400"
                                >
                                  <Package className="w-4 h-4" />
                                  <span>{isUpdating ? 'Initiating Packing...' : '📦 Prepare Order (Pack & Quality Grade)'}</span>
                                </button>
                              )}

                              {orderStatus === 'PREPARING' && (
                                <button
                                  onClick={() => handleDispatchOrderForLot(lot)}
                                  disabled={isUpdating}
                                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-400"
                                >
                                  <Truck className="w-4 h-4" />
                                  <span>{isUpdating ? 'Marking In Transit...' : '🚚 Mark Dispatched to Logistics Hub'}</span>
                                </button>
                              )}

                              {orderStatus === 'TRANSIT' && (
                                <button
                                  onClick={() => handleDeliverOrderForLot(lot)}
                                  disabled={isUpdating}
                                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-400"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>{isUpdating ? 'Confirming Delivery...' : '✓ Confirm Delivered & Release Escrow'}</span>
                                </button>
                              )}

                              {orderStatus === 'DELIVERED' && (
                                <div className="flex items-center justify-between text-xs bg-stone-100 text-emerald-800 p-2.5 rounded-xl border border-stone-200 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    Order Delivered & Settled
                                  </span>
                                  <span className="text-[11px] font-mono font-extrabold text-stone-900">
                                    ₹{(lot.quantity * lot.base_price_per_unit).toLocaleString()} Settled
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 px-1">
                                <span>Fulfillment Status: <strong className="text-stone-800 uppercase font-bold">{orderStatus}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => handleSwitchSubTab('farmer-orders')}
                                  className="text-teal-700 hover:text-teal-800 font-semibold underline inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  View in Orders tab <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VERIFIED BUYERS SECTION */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-stone-900">Verified Institutional Buyers</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin Verified
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {selectedLotForMatch 
                    ? `Showing corporate buyers interested in ${selectedLotForMatch.crop_name} (${selectedLotForMatch.quality_grade})` 
                    : 'Institutional buyers reviewed & approved by FarmiQ Admin with pre-funded Escrow'}
                </p>
              </div>

              {selectedLotForMatch && (
                <div className="text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 self-start sm:self-auto">
                  Clicking "Lock Contract" creates an immediate legally binding escrow contract for Lot #{selectedLotForMatch.id}
                </div>
              )}
            </div>

            {verifiedBuyers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-300">
                <ShieldCheck className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-800">No verified buyers available right now</h4>
                <p className="text-xs text-stone-500 mt-1">
                  When new corporate buyers register, FarmiQ Admin reviews and verifies their GSTIN/FSSAI credentials before they appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifiedBuyers.map((buyer) => {
                  const isMatchForSelectedLot = selectedLotForMatch && (
                    buyer.demand_crop.toLowerCase().includes(selectedLotForMatch.crop_name.toLowerCase()) ||
                    selectedLotForMatch.crop_name.toLowerCase().includes(buyer.demand_crop.toLowerCase())
                  );

                  return (
                    <div
                      key={buyer.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                        isMatchForSelectedLot 
                          ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Company & Admin verified tag */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-stone-700" />
                              <h4 className="text-sm font-bold text-stone-900">{buyer.company_name}</h4>
                            </div>
                            <p className="text-[11px] text-stone-500 font-medium mt-0.5">{buyer.buyer_type}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified by Admin
                          </span>
                        </div>

                        {/* Demands */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-stone-600">Procurement Crop Demand:</span>
                            <span className="font-bold text-stone-900">{buyer.demand_crop} ({buyer.demand_grade})</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-stone-600">Target Volume:</span>
                            <span className="font-bold text-stone-900">{buyer.target_volume_quintal} {buyer.unit}</span>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-stone-200">
                            <span className="text-stone-600">Procurement Offer Price:</span>
                            <span className="text-sm font-bold text-emerald-800">₹{buyer.procurement_price} / {buyer.unit}</span>
                          </div>
                        </div>

                        {/* Contact & Location Details */}
                        <div className="text-[11px] text-stone-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-stone-400" /> Sourcing: <span className="font-medium text-stone-800">{buyer.contact_person}</span>
                          </p>
                          {buyer.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" /> {buyer.phone} • {buyer.email}
                            </p>
                          )}
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" /> Distribution Hub: {buyer.location}
                          </p>
                          {buyer.gstin && (
                            <p className="font-mono text-[10px] text-stone-500">
                              GSTIN: {buyer.gstin} • Escrow: 100% Pre-funded
                            </p>
                          )}
                        </div>

                        {/* Match Reasons */}
                        {buyer.match_reasons && buyer.match_reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {buyer.match_reasons.map((reason, idx) => (
                              <span key={idx} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="pt-4 mt-3 border-t border-stone-100">
                        {selectedLotForMatch ? (
                          <button
                            onClick={() => handleMatchLotWithBuyer(selectedLotForMatch.id, buyer.id)}
                            disabled={matchingLotId === selectedLotForMatch.id || selectedLotForMatch.status !== 'AVAILABLE'}
                            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>
                              {matchingLotId === selectedLotForMatch.id 
                                ? 'Locking Escrow Contract...' 
                                : `Lock Contract for Lot #${selectedLotForMatch.id} (₹${buyer.procurement_price}/Q)`}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const matchingLot = lots.find(l => l.status === 'AVAILABLE' && l.crop_name.toLowerCase().includes(buyer.demand_crop.toLowerCase()));
                              if (matchingLot) {
                                setSelectedLotForMatch(matchingLot);
                              } else {
                                const anyAvailable = lots.find(l => l.status === 'AVAILABLE');
                                if (anyAvailable) setSelectedLotForMatch(anyAvailable);
                                else handleOpenCreateLotModal();
                              }
                            }}
                            className="w-full py-2 rounded-xl border border-stone-300 hover:border-emerald-500 text-stone-700 hover:text-emerald-800 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer bg-white"
                          >
                            <span>Select Lot to Contract with this Buyer</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: FPO COLLECTIVES & MULTI-FARMER COOPERATIVE POOLING */}
      {fpoViewMode === 'collectives' && (
        <div className="space-y-6">
          {collectiveActionMsg && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{collectiveActionMsg}</span>
              </div>
              <button onClick={() => setCollectiveActionMsg(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>
          )}

          {/* FPO Cooperative Overview Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active FPOs</span>
                <Building2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {collectives.filter(c => c.members?.some(m => m.farmer_id === user.id && m.status === 'ACCEPTED')).length}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Collectives You Lead or Belong To</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Target Quota</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-800">
                {collectives.reduce((acc, c) => acc + (c.target_volume_quintal || 0), 0).toLocaleString('en-IN')} <span className="text-xs font-bold text-stone-500 font-sans">Qtl</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Pooled Institutional Capacity</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Network Farmers</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {networkFarmers.length}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Verified Farmers in Platform</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Invites</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {collectives.filter(c => c.members?.some(m => m.farmer_id === user.id && m.status === 'INVITED')).length}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Awaiting Your Acceptance</p>
            </div>
          </div>

          {/* PENDING INVITATIONS BANNER (If current farmer has received invites) */}
          {collectives.filter(c => c.members?.some(m => m.farmer_id === user.id && m.status === 'INVITED')).length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-amber-600 animate-spin" />
                <span>You Have Pending FPO Collective Invitations!</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {collectives
                  .filter(c => c.members?.some(m => m.farmer_id === user.id && m.status === 'INVITED'))
                  .map(c => (
                    <div key={c.id} className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-stone-900 text-sm">{c.name}</h5>
                          <p className="text-xs text-stone-500">Lead Director: {c.lead_farmer_name} • {c.location}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {c.focus_crop}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{c.description}</p>
                      <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                        <span>Target Quota: <strong>{c.target_volume_quintal} Quintals</strong></span>
                        <span>{c.members?.length || 0} Farmers Connected</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleRespondToCollectiveInvite(c.id, 'decline')}
                          className="flex-1 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondToCollectiveInvite(c.id, 'accept')}
                          className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Join FPO</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* FPO COLLECTIVES SECTION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-stone-900">Your FPO Farmer Collectives ({collectives.length})</h4>
                <p className="text-xs text-stone-500">Multi-farmer producer organizations pooling quotas for commercial institutional buyers</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search collectives..."
                    value={collectiveSearchQuery}
                    onChange={e => setCollectiveSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white text-stone-800 focus:outline-emerald-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateCollectiveModal(true)}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Form FPO</span>
                </button>
              </div>
            </div>

            {collectives.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-stone-300 max-w-xl mx-auto">
                <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-stone-800">No FPO Collectives Formed Yet</h4>
                <p className="text-xs text-stone-500 mt-1 mb-4">
                  Connect with fellow farmers in your cluster, pool your harvest quotas, and fulfill high-value institutional retail contracts together!
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateCollectiveModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  + Form Your First FPO Collective
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {collectives
                  .filter(c => {
                    if (!collectiveSearchQuery) return true;
                    const q = collectiveSearchQuery.toLowerCase();
                    return c.name.toLowerCase().includes(q) || c.focus_crop.toLowerCase().includes(q) || (c.location && c.location.toLowerCase().includes(q));
                  })
                  .map(c => {
                    const isLead = c.lead_farmer_id === user.id;
                    const acceptedMembers = (c.members || []).filter(m => m.status === 'ACCEPTED');
                    const invitedMembers = (c.members || []).filter(m => m.status === 'INVITED');
                    const totalContributed = acceptedMembers.reduce((sum, m) => sum + (Number(m.contributed_quantity) || 0), 0);
                    const progressPct = Math.min(100, Math.round((totalContributed / (c.target_volume_quintal || 1)) * 100));

                    return (
                      <div key={c.id} className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-stone-900">{c.name}</h4>
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono text-[10px]">
                                  {c.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                <span>{c.location || 'Agri Cluster Hub'}</span>
                                <span>•</span>
                                <span className="font-semibold text-teal-800">{c.focus_crop}</span>
                              </div>
                            </div>
                            {isLead ? (
                              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black uppercase tracking-wider shrink-0">
                                Lead Director
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold shrink-0">
                                Member
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-600 leading-relaxed">{c.description}</p>

                          {/* Progress towards target volume */}
                          <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-stone-600 font-medium">Committed Quota Progress</span>
                              <span className="font-bold text-stone-900 font-mono">{totalContributed} / {c.target_volume_quintal} Quintals ({progressPct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Pooled Member Farmers Chips */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                              <span>Connected Farmers ({acceptedMembers.length} Joined, {invitedMembers.length} Invited)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {acceptedMembers.map(m => (
                                <div
                                  key={m.farmer_id}
                                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border ${
                                    m.farmer_id === c.lead_farmer_id
                                      ? 'bg-teal-50 text-teal-900 border-teal-200 font-bold'
                                      : 'bg-stone-50 text-stone-800 border-stone-200 font-medium'
                                  }`}
                                >
                                  <UserIcon className="w-3 h-3 text-stone-500" />
                                  <span>{m.farmer_name}</span>
                                  {m.farmer_id === c.lead_farmer_id && (
                                    <span className="text-[10px] text-teal-600">★</span>
                                  )}
                                  {m.contributed_quantity ? (
                                    <span className="text-[10px] text-stone-400 font-mono">({m.contributed_quantity}Q)</span>
                                  ) : null}
                                </div>
                              ))}
                              {invitedMembers.map(m => (
                                <div
                                  key={m.farmer_id}
                                  className="px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border border-dashed border-amber-300 bg-amber-50/70 text-amber-900 font-medium"
                                >
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  <span>{m.farmer_name}</span>
                                  <span className="text-[10px] text-amber-700 bg-amber-200/60 px-1 rounded">Invited</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCollectiveForInvite(c);
                              setShowInviteModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-teal-600" />
                            <span>+ Invite Farmers</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAssembleLotFromCollective(c)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Assemble Graded Lot</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* FARMERS NETWORK DIRECTORY (Connect with other farmers) */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-stone-900">FarmiQ Regional Farmers Directory ({networkFarmers.length})</h4>
                <p className="text-xs text-stone-500">Connect directly with verified farmers in your district to pool harvests and create FPOs together</p>
              </div>
              <div className="text-xs text-stone-500">
                Showing verified registered farmers on platform
              </div>
            </div>

            {networkFarmers.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 text-xs">
                <Users className="w-8 h-8 mx-auto text-stone-400 mb-2 opacity-60" />
                <p className="font-semibold text-stone-700">No other farmers registered yet</p>
                <p className="text-stone-400 text-[11px] mt-0.5">As new farmers register on FarmiQ, they will appear here for collaborative pooling.</p>
              </div>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {networkFarmers.map(nf => {
                // Check if this farmer is already in any of the current user's collectives
                const joinedCollective = collectives.find(c => c.members?.some(m => m.farmer_id === nf.id && m.status === 'ACCEPTED'));
                const pendingCollective = collectives.find(c => c.members?.some(m => m.farmer_id === nf.id && m.status === 'INVITED'));

                return (
                  <div key={nf.id} className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:border-teal-300 transition space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-stone-900 text-sm">{nf.full_name}</h5>
                          <p className="text-xs text-stone-500">{nf.farm_name}</p>
                        </div>
                        <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {nf.full_name[0]}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{nf.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-mono text-[11px]">{nf.phone}</span>
                        </div>
                      </div>

                      {/* Active listed produce */}
                      {nf.active_products && nf.active_products.length > 0 && (
                        <div className="pt-2 border-t border-stone-100">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Listed Produce:</span>
                          <div className="flex flex-wrap gap-1">
                            {nf.active_products.map((p: any) => (
                              <span key={p.id} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                                {p.quantity} {p.unit} {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Invite button / connection status */}
                    <div className="pt-3 border-t border-stone-100">
                      {joinedCollective ? (
                        <div className="w-full py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold text-center border border-teal-200 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Connected in {joinedCollective.name}</span>
                        </div>
                      ) : pendingCollective ? (
                        <div className="w-full py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold text-center border border-amber-200 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Invitation Pending ({pendingCollective.name})</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (collectives.length === 0) {
                              alert('Please form an FPO Collective first to invite members.');
                              setShowCreateCollectiveModal(true);
                            } else if (collectives.length === 1) {
                              handleInviteFarmerToCollective(collectives[0].id, nf.id);
                            } else {
                              setSelectedFarmerToInviteDirect(nf);
                              setShowInviteModal(true);
                            }
                          }}
                          disabled={invitingFarmer}
                          className="w-full py-2 bg-teal-50 hover:bg-teal-700 hover:text-white text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Invite to FPO Collective</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

      {/* SUB-TAB 2: INCOMING ORDERS */}
      {subTab === 'farmer-orders' && (
        <div>
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No customer orders yet.</h3>
              <p className="text-xs text-stone-500 mt-1">
                As soon as customers in your area place an order, it will appear here in real-time with delivery details.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {orderNotification && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-relaxed">{orderNotification}</span>
                    </div>
                    <button 
                      onClick={() => { setOrderNotification(null); setAcceptedWhatsAppUrl(null); }} 
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  {acceptedWhatsAppUrl && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <a
                        href={acceptedWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1.5 transition shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>📲 Open Customer WhatsApp Accepted Alert</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-[11px] text-emerald-800">Customer message contains direct Track, Pay & Invoice options.</span>
                    </div>
                  )}
                </div>
              )}
              {myOrders.map((o) => {
                const isPaid = o.payment_status === 'PAID' || o.status === 'PAID' || o.payment_status === 'LOCKED_IN_ESCROW';
                const isCOD = o.payment_method === 'Cash on Delivery' || o.payment_status === 'CASH_ON_DELIVERY';
                const isPaymentSettled = isPaid || isCOD;
                const isConfirmed = o.status === 'CONFIRMED' || o.status === 'ACCEPTED' || isPaymentSettled || ['PREPARING', 'TRANSIT', 'DELIVERED'].includes(o.status);

                return (
                <div key={o.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900">Order #{o.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        o.status === 'TRANSIT' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                        isPaid ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        isCOD ? 'bg-teal-100 text-teal-900 border border-teal-300' :
                        o.status === 'CONFIRMED' || o.status === 'ACCEPTED' ? 'bg-teal-100 text-teal-800' :
                        o.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-900 animate-pulse border border-amber-300'
                      }`}>
                        {o.status === 'ORDERED' ? '🔔 AWAITING YOUR ACCEPTANCE' : o.status === 'CONFIRMED' ? 'CONFIRMED' : o.status}
                      </span>
                      {isPaid && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> PAID via UPI
                        </span>
                      )}
                      {isCOD && !isPaid && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white flex items-center gap-1">
                          <Banknote className="w-3 h-3" /> Cash on Delivery
                        </span>
                      )}
                      <span className="text-[11px] text-stone-500">
                        {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900">
                      {o.quantity} {o.unit} of {o.product_name}
                    </h4>

                    <div className="text-xs text-stone-600 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>Customer: <strong className="font-semibold text-stone-800">{o.customer_name}</strong></span>
                        {o.customer_phone && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{o.customer_phone}</span>
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        Delivery Address: {o.delivery_address}
                      </p>
                    </div>

                    {/* WhatsApp Status Information for Farmer */}
                    {o.status === 'ORDERED' && o.farmer_whatsapp_url && (
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                          <span>📲 WhatsApp Order Alert Received</span>
                        </span>
                        <a
                          href={o.farmer_whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1"
                        >
                          <span>Open WhatsApp Message</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {isConfirmed && o.customer_whatsapp_url && (
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-teal-600" />
                          <span>Customer notified with Track, Pay & Invoice options</span>
                        </span>
                        <a
                          href={o.customer_whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>View Customer WhatsApp Alert</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                      <span>Produce: <strong className="text-stone-800">₹{o.product_total}</strong></span>
                      <span>+</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Delivery Fee to You: <strong>₹{o.delivery_charge}</strong>
                      </span>
                      <span>=</span>
                      <span>Total Farmer Payout: <strong className="text-emerald-800 font-bold text-sm">₹{o.grand_total}</strong></span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : isCOD ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {isPaid ? `✓ Paid via UPI (UTR: ${o.transaction_id || 'VERIFIED'})` : isCOD ? '💵 Cash on Delivery (Pay at Doorstep)' : '⏳ Awaiting Customer Payment / COD Selection'}
                      </span>
                    </div>

                    {/* Delivery Agent Assignment Card */}
                    <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${o.delivery_agent_assigned ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-900">
                              {o.delivery_agent_assigned && o.driver_name ? o.driver_name : `${o.farmer_name || user.full_name} (Farmer Direct)`}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              o.delivery_agent_assigned 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {o.delivery_agent_assigned ? 'Designated Delivery Agent' : 'Farmer Default Dispatch'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Contact: <strong className="text-stone-700">{o.delivery_agent_assigned && o.driver_phone ? o.driver_phone : (o.farmer_phone || user.phone)}</strong>
                            {o.vehicle_number ? ` • Vehicle: ${o.vehicle_number}` : ''}
                            {!o.delivery_agent_assigned && ' • (Visible to customer until you assign an agent)'}
                          </p>
                        </div>
                      </div>
                      {o.status !== 'DELIVERED' && o.status !== 'REJECTED' && o.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignAgentModal(o)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-emerald-500 text-stone-800 hover:text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{o.delivery_agent_assigned ? 'Change Agent' : '+ Assign Delivery Agent'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Progression Workflow */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0">
                    {/* View Invoice Button (Available once confirmed) */}
                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleOpenInvoiceModal(o)}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-200 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View / Print Invoice</span>
                      </button>
                    )}

                    {o.status === 'ORDERED' && (
                      <div className="flex items-center gap-2">
                        {o.payment_method === 'Cash on Delivery' || o.payment_status === 'CASH_ON_DELIVERY' ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCodAction(o.id, false); }}
                              disabled={updatingOrderId === o.id}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                            >
                              Reject COD
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCodAction(o.id, true); }}
                              disabled={updatingOrderId === o.id}
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer disabled:bg-stone-400 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{updatingOrderId === o.id ? 'Accepting...' : 'Accept COD (Start Packing)'}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRejectOrder(o.id); }}
                              disabled={updatingOrderId === o.id}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAcceptOrder(o.id); }}
                              disabled={updatingOrderId === o.id}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:bg-stone-400 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{updatingOrderId === o.id ? 'Accepting...' : 'Accept Order (Create Invoice)'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Waiting for customer payment or COD before granting Prepare and Transit options */}
                    {(o.status === 'CONFIRMED' || o.status === 'ACCEPTED') && !isPaymentSettled && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-right max-w-xs space-y-1">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-amber-900">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                          <span>Awaiting Customer Payment / COD</span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-tight">
                          Order accepted. Customer will pay online or select Cash on Delivery. Packing & Transit options unlock immediately once paid or COD is confirmed.
                        </p>
                        {o.customer_phone && (
                          <p className="text-[10px] text-stone-500">
                            Customer phone: <span className="font-semibold text-stone-700">{o.customer_phone}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {(o.status === 'CONFIRMED' || o.status === 'ACCEPTED' || o.status === 'PAID') && isPaymentSettled && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(o.id, 'PREPARING'); }}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>{updatingOrderId === o.id ? 'Starting packing...' : '📦 Prepare Order (Pack & Sort)'}</span>
                      </button>
                    )}
                    {o.status === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const driverDetails = promptDriverDetails();
                          if (driverDetails === null) return;
                          handleStatusUpdate(o.id, 'TRANSIT', driverDetails);
                        }}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{updatingOrderId === o.id ? 'Dispatching...' : '🚚 Handover to Transit'}</span>
                      </button>
                    )}
                    {o.status === 'TRANSIT' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(o.id, 'DELIVERED'); }}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{updatingOrderId === o.id ? 'Confirming...' : '✓ Confirm Delivered'}</span>
                      </button>
                    )}
                    {o.status === 'DELIVERED' && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle className="w-4 h-4" /> Delivered & Settled
                      </div>
                    )}
                    {o.status === 'REJECTED' && (
                      <div className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                        Rejected by you
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: BUYER REQUIREMENTS & DEMAND POOL */}
      {subTab === 'buyer-requirements' && (
        <div className="space-y-6 text-left">
          {reqActionMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reqActionMsg}</span>
              </div>
              <button onClick={() => setReqActionMsg(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-['Outfit']">Customer Requirements & Bulk Demands</h3>
              <p className="text-xs text-stone-500">
                Direct procurement requests posted by consumers and restaurants. Accept and fulfill to generate instant direct orders!
              </p>
            </div>

            <button
              onClick={loadFarmerData}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Demands</span>
            </button>
          </div>

          {requirements.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
              <FilePlus className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-stone-800">No buyer requirements currently active.</h4>
              <p className="text-xs text-stone-500 mt-1">
                When buyers post custom orders for bulk vegetables or fruits, they will appear here instantly for you to accept.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((req) => {
                const isClaimedByMe = req.accepted_by_farmer_id === user.id;
                const isClaimedByOther = req.status === 'ACCEPTED' && !isClaimedByMe;
                const totalPayout = (req.required_quantity || 0) * (req.expected_price || 0);

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                      isClaimedByMe ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header tags */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">#{req.id}</span>
                          <span className="text-[11px] text-stone-500 font-medium">
                            Posted {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                          isClaimedByMe ? 'bg-emerald-100 text-emerald-800' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {req.status === 'OPEN' ? '● OPEN TO CLAIM' : isClaimedByMe ? '✓ CLAIMED BY YOU' : `CLAIMED by ${req.accepted_by_farmer_name}`}
                        </span>
                      </div>

                      {/* Crop info */}
                      <div>
                        <h4 className="text-lg font-bold text-stone-900">
                          {req.required_quantity} {req.unit} of {req.crop_name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs text-stone-500">Buyer Target Price:</span>
                          <span className="text-base font-bold text-emerald-800">₹{req.expected_price} / {req.unit}</span>
                          <span className="text-xs font-semibold text-stone-700">
                            (Total: ₹{totalPayout.toLocaleString('en-IN')})
                          </span>
                        </div>
                      </div>

                      {/* Customer info & Delivery */}
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                          <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                          <span>Buyer: {req.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{req.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>Needed By: <strong>{req.needed_by_date}</strong></span>
                        </div>
                        {req.notes && (
                          <p className="text-stone-500 italic pt-1 border-t border-stone-200 mt-1">
                            "{req.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-4 mt-2 border-t border-stone-100">
                      {req.status === 'OPEN' ? (
                        <button
                          onClick={() => handleAcceptRequirement(req.id)}
                          disabled={acceptingReqId === req.id}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>{acceptingReqId === req.id ? 'Claiming...' : 'Accept & Claim This Order'}</span>
                        </button>
                      ) : isClaimedByMe ? (
                        <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 font-medium">
                          <span>✓ In your Incoming Orders tab</span>
                          <button
                            type="button"
                            onClick={() => handleSwitchSubTab('farmer-orders')}
                            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                          >
                            View Order →
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-stone-400 font-medium py-1">
                          Fulfilled by {req.accepted_by_farmer_name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: DISPUTES & GRIEVANCES */}
      {subTab === 'disputes' && (
        <div className="space-y-6 text-left">
          {dispSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dispSuccessMsg}</span>
              </div>
              <button onClick={() => setDispSuccessMsg(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File grievance form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Farmer Grievance Desk</h3>
                  <p className="text-[11px] text-stone-500">Neutral Admin Escrow & payment protection desk</p>
                </div>
              </div>

              <form onSubmit={handleFileDispute} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Related Order</label>
                  <select
                    value={dispOrderId}
                    onChange={(e) => setDispOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Select an incoming order (or general issue)</option>
                    {myOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} - {o.product_name} (Buyer: {o.customer_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subject / Issue Category *</label>
                  <select
                    value={dispSubject}
                    onChange={(e) => setDispSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Select issue category</option>
                    <option value="Escrow Payment Release Delayed">Escrow Payment Release Delayed</option>
                    <option value="Transporter / Truck Failed to Arrive">Transporter / Truck Failed to Arrive</option>
                    <option value="Buyer Rejected Fresh Produce Without Cause">Buyer Rejected Fresh Produce Without Cause</option>
                    <option value="Transit Damage Dispute">Transit Damage Dispute</option>
                    <option value="Cold Storage Booking Grievance">Cold Storage Booking Grievance</option>
                    <option value="Other Farm Support Issue">Other Farm Support Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Detailed Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about the consignment, truck status, or buyer interaction..."
                    value={dispDescription}
                    onChange={(e) => setDispDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDisp}
                  className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingDisp ? 'Submitting...' : 'Submit to Admin Escrow Desk'}</span>
                </button>
              </form>
            </div>

            {/* List of filed disputes */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Your Grievances & Claims</h3>
                  <p className="text-xs text-stone-500">Track claim investigation and payment escrow settlements</p>
                </div>
                <button
                  onClick={loadFarmerData}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {disputes.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
                  <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-800">No active grievances filed.</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Your transactions are operating under FarmiQ protected contracts and direct escrow payouts.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">Case #{d.id}</span>
                          {d.order_id && (
                            <span className="text-xs text-stone-500 font-medium">Order #{d.order_id}</span>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                          d.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">{d.subject}</h4>
                      <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 leading-relaxed">
                        {d.description}
                      </p>

                      {d.status === 'RESOLVED' && d.resolution && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 mt-2">
                          <strong className="block mb-0.5 font-bold">Admin Resolution:</strong>
                          <span>{d.resolution}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-stone-400 pt-1">
                        Reported on {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* EDIT PRODUCE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-700 to-orange-600 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">Edit Listing: {editingProduct.name}</h2>
                <p className="text-xs text-amber-100 mt-0.5">Update your produce details, price, quantity, or photo.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleUpdateProduce} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
              {/* Crop Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product / Crop Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Category and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                  <select
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-amber-600"
                  >
                    <option value="" disabled>-- Select Category --</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains &amp; Pulses</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other Fresh Produce</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit *</label>
                  <select
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-amber-600"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="box">Crate / Box</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Price (₹ per {editUnit}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                  <p className="text-[10px] text-stone-500 mt-0.5">Must be at or below the APMC Mandi rate</p>
                </div>
              </div>

              {/* Harvest Date and Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={editHarvestDate}
                    onChange={(e) => setEditHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Farm Location *</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Organic */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-organic-check"
                  checked={editOrganic}
                  onChange={(e) => setEditOrganic(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 border-stone-300 focus:ring-amber-500"
                />
                <label htmlFor="edit-organic-check" className="text-xs font-bold text-stone-800 flex items-center gap-1 cursor-pointer">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Chemical-Free / Organic Certified Produce
                </label>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Produce Image (optional — leave unchanged to keep current)</label>
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition bg-stone-50/50 flex flex-col items-center justify-center"
                >
                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditImageChange}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />
                  {editImagePreview ? (
                    <div className="space-y-2">
                      <img src={editImagePreview} alt="Preview" className="h-28 w-auto mx-auto rounded-lg object-cover shadow-xs" />
                      <p className="text-[11px] text-amber-700 font-semibold">Click to choose a different photo</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-stone-400 mb-1" />
                      <p className="text-xs font-semibold text-stone-700">Click to upload a new photo</p>
                      <p className="text-[10px] text-stone-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Description &amp; Quality Notes</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g. Freshly hand-picked, grade-A firmness, sorted and graded."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 mt-auto sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-200 transition disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">{t.addProduce}</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Upload actual produce photo, inspect live Mandi rates, and reach consumers directly.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProduce} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
              {/* Crop Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.productCropName || 'Product / Crop Name'} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.cropNamePlaceholder || "e.g. Mango, Tomato, Onion, Wheat, Green Chilli, etc."}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 pr-8"
                  />
                  {mandiLoading && (
                    <div className="absolute right-2.5 top-2.5">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Live Mandi Benchmark display inside modal */}
              {mandiLoading && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center gap-2 text-stone-600">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Fetching real-time APMC Mandi market price for &ldquo;{name}&rdquo;...</span>
                </div>
              )}

              {!mandiLoading && mandiRateDetails && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>{t.liveMandiRateApmc || "Live Mandi Market Rate (APMC / AGMARKNET)"}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ● Live Agmarknet Feed
                    </span>
                  </div>

                  <div className="flex items-start justify-between text-xs pt-1 border-t border-amber-200/60">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-stone-800 text-sm">
                        {mandiRateDetails.crop} {mandiRateDetails.variety ? <span className="font-normal text-stone-600 text-xs">({mandiRateDetails.variety})</span> : null}
                      </p>
                      <p className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-stone-800">{mandiRateDetails.mandi}</span>
                        <span>({mandiRateDetails.district ? `${mandiRateDetails.district}, ` : ''}{mandiRateDetails.state})</span>
                        {mandiRateDetails.distanceKm !== undefined && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded ml-1">
                            {mandiRateDetails.distanceKm} km away
                          </span>
                        )}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-500 font-medium shrink-0">📍 Market:</span>
                        <select
                          value={modalSelectedMandi}
                          onChange={(e) => setModalSelectedMandi(e.target.value)}
                          className="text-[11px] py-0.5 px-2 bg-white/95 border border-amber-300 rounded-md font-semibold text-stone-800 outline-none hover:bg-white transition max-w-[260px] truncate"
                        >
                          <option value="">Auto from Farm Location ({mandiRateDetails.mandi})</option>
                          {mandiMarkets.map(m => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.district ? `${m.district}, ` : ''}{m.state})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-amber-900 leading-tight">
                        ₹{mandiRateDetails.modal_price} <span className="text-xs font-medium text-stone-600">/ {unit || 'kg'}</span>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        {t.marketRange || 'Market Range'}: ₹{mandiRateDetails.min_price} – ₹{mandiRateDetails.max_price}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-stone-600">
                      Mandi Trend: <strong className="text-stone-800">{mandiRateDetails.trend || 'STABLE'}</strong> ({mandiRateDetails.pct_change ? `${mandiRateDetails.pct_change > 0 ? '+' : ''}${mandiRateDetails.pct_change}%` : 'Daily average'})
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrice(mandiRateDetails.modal_price)}
                      className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t.useMandiRate || 'Use Mandi Rate'} (₹{mandiRateDetails.modal_price})</span>
                    </button>
                  </div>
                </div>
              )}

              {!name.trim() && (
                <p className="text-[11px] text-stone-500 flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                  <span>💡</span>
                  <span>Enter crop name (e.g. <strong>Mango</strong>, <strong>Tomato</strong>, <strong>Onion</strong>, <strong>Wheat</strong>, <strong>Chilli</strong>) to instantly get the current Mandi price.</span>
                </p>
              )}

              {/* Category and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{t.category || 'Category'} *</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-emerald-600"
                  >
                    <option value="" disabled>{t.selectCategory || '-- Select Category --'}</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains & Pulses</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other Fresh Produce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{t.unitOfMeasurement || 'Unit of Measurement'} *</label>
                  <select
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-emerald-600"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="box">Crate / Box</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{t.availableQuantity || 'Available Quantity'} *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{t.farmerPrice || 'Farmer Price'} (₹ per {unit}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 40"
                    className={`w-full px-3 py-2 text-xs border rounded-lg outline-none transition ${
                      price && mandiRateDetails && Number(price) > (getUnitMandiCeiling(mandiRateDetails.modal_price, unit) || 999999)
                        ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30'
                        : 'border-stone-300 focus:border-emerald-600'
                    }`}
                  />
                  {mandiRateDetails && (
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">
                        {t.mandiBenchmark || 'Mandi Benchmark'}: <strong className="text-stone-800">₹{getUnitMandiCeiling(mandiRateDetails.modal_price, unit)}/{unit}</strong>
                      </span>
                      {price && Number(price) > (getUnitMandiCeiling(mandiRateDetails.modal_price, unit) || 999999) ? (
                        <span className="text-red-600 font-bold">⚠️ Exceeds Mandi rate</span>
                      ) : price ? (
                        <span className="text-emerald-700 font-semibold">✓ Allowed Price</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Exceeding Mandi Alert */}
              {price && mandiRateDetails && Number(price) > (getUnitMandiCeiling(mandiRateDetails.modal_price, unit) || 999999) && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Price higher than Mandi rate is not accepted</p>
                    <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                      To ensure fair pricing, products cannot be listed higher than the official APMC Mandi benchmark rate of <strong>₹{getUnitMandiCeiling(mandiRateDetails.modal_price, unit)}/{unit}</strong> (at {mandiRateDetails.mandi}).
                    </p>
                    <button
                      type="button"
                      onClick={() => setPrice(getUnitMandiCeiling(mandiRateDetails.modal_price, unit) || '')}
                      className="mt-2 px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold cursor-pointer transition"
                    >
                      Set Price to Mandi Rate (₹{getUnitMandiCeiling(mandiRateDetails.modal_price, unit)})
                    </button>
                  </div>
                </div>
              )}

              {/* Harvest Date and Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{t.harvestDate || 'Harvest Date'} *</label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-500">Calculates preservation & remaining shelf life</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">{t.farmLocation || 'Farm Location'} *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Farm location or village"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Organic Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organic-check"
                  checked={organic}
                  onChange={(e) => setOrganic(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-stone-300 focus:ring-emerald-500"
                />
                <label htmlFor="organic-check" className="text-xs font-bold text-stone-800 flex items-center gap-1 cursor-pointer">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  {t.chemicalFreeOrganic || 'Chemical-Free / Organic Certified Produce'}
                </label>
              </div>

              {/* Product Image Upload (Requirement: Real device upload with preview) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Produce Image (Upload from device) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-stone-50/50 flex flex-col items-center justify-center"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="h-28 w-auto mx-auto rounded-lg object-cover shadow-xs" />
                      <p className="text-[11px] text-emerald-700 font-semibold">Click to choose a different photo</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-stone-400 mb-1" />
                      <p className="text-xs font-semibold text-stone-700">Click to upload photo from your device</p>
                      <p className="text-[10px] text-stone-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description & Quality Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Freshly hand-picked early morning, grade-A firmness, sorted and graded without wax."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-3 mt-auto sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || Boolean(price && mandiRateDetails && Number(price) > (getUnitMandiCeiling(mandiRateDetails.modal_price, unit) || 999999))}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting 
                    ? 'Uploading Listing...' 
                    : price && mandiRateDetails && Number(price) > (getUnitMandiCeiling(mandiRateDetails.modal_price, unit) || 999999)
                      ? 'Price Exceeds Mandi Benchmark'
                      : (t.publishToMarketplace || 'Publish to Marketplace')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FPO PRODUCE LOT MODAL (DATA-DRIVEN DIGITAL POOLING) */}
      {showCreateLotModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-100 text-left max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 font-['Outfit']">
                    Digital FPO Produce Pooling & Lot Assembly
                  </h3>
                  <p className="text-xs text-stone-500">
                    Combine harvests with verified cooperative farmers for wholesale institutional contracts
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateLotModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-4 pt-4 text-xs overflow-y-auto flex-1 flex flex-col">
              {/* STEP 1: CROP & HARVEST SOURCE */}
              <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                    <Package className="w-4 h-4 text-emerald-600" /> Step 1: Select Crop & Harvest Source
                  </span>
                  <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setLotCropSourceMode('my-produce');
                        if (myProducts.length > 0) handleSelectMyProduce(myProducts[0]);
                      }}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        lotCropSourceMode === 'my-produce' 
                          ? 'bg-white text-emerald-800 shadow-2xs' 
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      From My Harvest ({myProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLotCropSourceMode('standard');
                        handleSelectStandardCrop(STANDARD_CROPS[0]);
                      }}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        lotCropSourceMode === 'standard' 
                          ? 'bg-white text-emerald-800 shadow-2xs' 
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      APMC Crop Catalog
                    </button>
                  </div>
                </div>

                {/* Mode A: Select from My Listed Produce */}
                {lotCropSourceMode === 'my-produce' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-stone-500">
                      Choose which crop from your active farm listings you want to pool into this FPO lot:
                    </p>
                    {myProducts.length === 0 ? (
                      <div className="p-3 bg-white rounded-xl border border-dashed border-stone-300 text-center">
                        <p className="text-[11px] text-stone-500">No active produce listed yet. Using APMC standard crop catalog instead.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {myProducts.map(p => {
                          const isSelected = selectedProduceId === p.id || lotCropName.toLowerCase() === p.name.toLowerCase();
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleSelectMyProduce(p)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-400' 
                                  : 'bg-white border-stone-200 hover:border-emerald-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold shrink-0 text-xs">
                                  {p.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-stone-900 text-xs">{p.name}</p>
                                  <p className="text-[10px] text-stone-500">
                                    Stock: {p.quantity} {p.unit} • ₹{p.price}/{p.unit}
                                  </p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Mode B: Standard APMC Catalog */}
                {lotCropSourceMode === 'standard' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-stone-500">Select standard commercial crop benchmark:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STANDARD_CROPS.map(c => {
                        const isSelected = lotCropName.toLowerCase() === c.name.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={c.name}
                            onClick={() => handleSelectStandardCrop(c)}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected 
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <span>{c.name}</span>
                            <span className={isSelected ? 'text-emerald-200 text-[10px]' : 'text-stone-400 text-[10px]'}>
                              ₹{c.benchmark}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Auto-filled details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block font-bold text-stone-700 mb-0.5 text-[11px]">Selected Crop</label>
                    <input
                      type="text"
                      readOnly
                      value={lotCropName}
                      className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg bg-stone-100 font-bold text-stone-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-0.5 text-[11px]">Variety / Hybrid</label>
                    <input
                      type="text"
                      value={lotVariety}
                      onChange={(e) => setLotVariety(e.target.value)}
                      placeholder="e.g. Shivam Red"
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-0.5 text-[11px]">Packaging Standard</label>
                    <input
                      type="text"
                      value={lotPackaging}
                      onChange={(e) => setLotPackaging(e.target.value)}
                      placeholder="e.g. Plastic Crates (25kg)"
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-stone-700 mb-0.5 text-[11px]">Base Offer Price (₹ / {lotUnit}) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={lotBasePrice}
                      onChange={(e) => setLotBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-bold text-emerald-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-0.5 text-[11px]">Aggregation Hub / Cluster</label>
                    <input
                      type="text"
                      value={lotLocation}
                      onChange={(e) => setLotLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: MULTI-FARMER COOPERATIVE POOLING */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <Users className="w-4 h-4 text-amber-700" /> Step 2: FPO Member Farmers Aggregation (2+ Required)
                    </span>
                    <p className="text-[10px] text-amber-800">
                      Cooperative pooling combines authentic produce from registered farmers into a single commercial lot
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto ${
                    lotMemberFarmers.length >= 2 
                      ? 'bg-emerald-200 text-emerald-950' 
                      : 'bg-amber-200 text-amber-950'
                  }`}>
                    {lotMemberFarmers.length} / 2+ Farmers Included
                  </span>
                </div>

                {/* LEAD FARMER CARD (YOU) */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        1
                      </span>
                      <div>
                        <span className="font-bold text-stone-900 text-xs">
                          {user.full_name} <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">You (Lead Aggregator)</span>
                        </span>
                        <p className="text-[10px] text-stone-500">
                          {user.farm_name || 'Your Farm'} • 📍 {user.location || 'Lasalgaon'} • 📞 {user.phone || '+91 98220 54321'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                    <span className="text-stone-600 font-medium">Your Contributed Volume ({lotUnit}):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={lotMemberFarmers[0]?.contributed_quantity || 40}
                        onChange={(e) => handleUpdateMemberQuantity(0, Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-emerald-300 rounded-lg font-bold text-emerald-800 text-right bg-emerald-50/50 text-xs"
                      />
                      <span className="text-stone-500 font-semibold text-[10px]">{lotUnit}</span>
                    </div>
                  </div>
                </div>

                {/* DIGITAL FARMER DISCOVERY & NETWORK SELECTION */}
                <div className="p-3 bg-white/90 rounded-xl border border-amber-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Discover & Invite Network Farmers
                    </span>
                    <div className="flex items-center gap-1 text-[10px] bg-stone-100 p-0.5 rounded-lg font-bold">
                      <button
                        type="button"
                        onClick={() => setFarmerDirectoryTab('matching')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${
                          farmerDirectoryTab === 'matching' 
                            ? 'bg-white text-amber-900 shadow-2xs' 
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Selling {lotCropName} ({networkFarmers.filter(f => f.has_matching_crop).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFarmerDirectoryTab('all')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer ${
                          farmerDirectoryTab === 'all' 
                            ? 'bg-white text-amber-900 shadow-2xs' 
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        All FPO Farmers ({networkFarmers.length})
                      </button>
                    </div>
                  </div>

                  {/* Search box within farmers */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={farmerSearchQuery}
                      onChange={(e) => setFarmerSearchQuery(e.target.value)}
                      placeholder="Search farmer name, farm, or village sub-cluster..."
                      className="w-full pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs outline-none bg-stone-50/70 focus:bg-white"
                    />
                  </div>

                  {/* Farmer Candidates List */}
                  {loadingNetworkFarmers ? (
                    <div className="py-4 text-center text-stone-400 text-xs">
                      Loading registered farmers in network...
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {networkFarmers
                        .filter(f => {
                          if (farmerDirectoryTab === 'matching' && !f.has_matching_crop) return false;
                          if (!farmerSearchQuery) return true;
                          const q = farmerSearchQuery.toLowerCase();
                          return f.full_name.toLowerCase().includes(q) ||
                                 (f.farm_name && f.farm_name.toLowerCase().includes(q)) ||
                                 f.location.toLowerCase().includes(q);
                        })
                        .map(f => {
                          const isAlreadyAdded = lotMemberFarmers.some(mf => mf.farmer_id === f.id || mf.farmer_name.toLowerCase() === f.full_name.toLowerCase());
                          return (
                            <div
                              key={f.id}
                              className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                                isAlreadyAdded 
                                  ? 'bg-emerald-50/50 border-emerald-200' 
                                  : 'bg-stone-50 border-stone-200 hover:border-amber-300 hover:bg-amber-50/40'
                              }`}
                            >
                              <div className="space-y-0.5 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-900 text-xs">{f.full_name}</span>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Verified
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-500">
                                  {f.farm_name} • 📍 {f.location} • 📞 {f.phone}
                                </p>
                                {f.has_matching_crop && (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    🌾 Has {f.matching_quantity} {f.matching_unit} {f.matching_crop_name} in stock
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={isAlreadyAdded}
                                onClick={() => handleAddFarmerToPool(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                                  isAlreadyAdded 
                                    ? 'bg-emerald-100 text-emerald-800 cursor-default' 
                                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                                }`}
                              >
                                {isAlreadyAdded ? '✓ Pooled' : '+ Add to Pool'}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Phone / ID Lookup option */}
                  <div className="pt-2 border-t border-stone-200/70">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={phoneLookupQuery}
                        onChange={(e) => {
                          setPhoneLookupQuery(e.target.value);
                          setPhoneLookupError(null);
                        }}
                        placeholder="Invite by Phone number or Name..."
                        className="flex-1 px-2.5 py-1 border border-stone-300 rounded-lg text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleLookupAndAddPhone}
                        className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-lg cursor-pointer transition"
                      >
                        Verify & Add
                      </button>
                    </div>
                    {phoneLookupError && (
                      <p className="text-[10px] text-red-600 font-medium mt-1">{phoneLookupError}</p>
                    )}
                  </div>
                </div>

                {/* CURRENT ACTIVE POOLED MEMBERS LIST */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-950 flex items-center justify-between">
                    <span>Participating Co-op Members ({lotMemberFarmers.length})</span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Total Volume: {lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0)} {lotUnit}
                    </span>
                  </span>

                  <div className="space-y-1.5">
                    {lotMemberFarmers.map((mf, idx) => {
                      const totalLotQty = lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
                      const sharePct = totalLotQty > 0 ? ((Number(mf.contributed_quantity) / totalLotQty) * 100).toFixed(1) : '0';
                      const payout = (Number(mf.contributed_quantity) || 0) * (Number(lotBasePrice) || 0);

                      return (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-stone-800 text-xs">{mf.farmer_name}</span>
                                {mf.farm_name && (
                                  <span className="text-stone-500 text-[10px] ml-1.5">({mf.farm_name})</span>
                                )}
                                <span className="text-stone-400 text-[10px] block">📍 {mf.farm_location || 'Local Cluster'} • 📞 {mf.phone}</span>
                              </div>
                            </div>

                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMemberFromPool(idx)}
                                className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-100 text-[11px] items-center">
                            <div>
                              <label className="block text-[10px] text-stone-500">Volume ({lotUnit})</label>
                              <input
                                type="number"
                                min="1"
                                value={mf.contributed_quantity}
                                onChange={(e) => handleUpdateMemberQuantity(idx, Number(e.target.value))}
                                className="w-full px-2 py-0.5 border border-stone-300 rounded font-bold text-emerald-800 bg-stone-50 text-xs"
                              />
                            </div>
                            <div className="text-center">
                              <span className="block text-[10px] text-stone-500">Lot Share</span>
                              <span className="font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                                {sharePct}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] text-stone-500">Est. Payout</span>
                              <span className="font-bold text-emerald-700">
                                ₹{payout.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FPO CRITERIA STATUS */}
                {lotMemberFarmers.length < 2 ? (
                  <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>FPO Cooperative Criteria:</strong> At least 1 more member farmer is required. Please click "+ Add to Pool" on any registered farmer above.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCheck className="w-4 h-4 text-emerald-700" />
                      FPO Cooperative Criteria Satisfied: {lotMemberFarmers.length} Farmers Pooling {lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0)} {lotUnit}
                    </span>
                    <span className="font-bold text-emerald-950">
                      Total Valuation: ₹{(lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0) * (Number(lotBasePrice) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* STEP 3: QUALITY GRADING & LAB TESTING */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4 text-emerald-600" /> Step 3: Quality Certification & Lab Parameters
                  </span>
                  <select
                    value={lotGrade}
                    onChange={(e) => setLotGrade(e.target.value as QualityGrade)}
                    className="px-2.5 py-1 border border-stone-300 rounded-lg bg-white font-bold text-xs text-emerald-800 cursor-pointer"
                  >
                    <option value="Grade-A">Grade-A (Premium)</option>
                    <option value="Export-Grade">Export-Grade (Highest Quality)</option>
                    <option value="Grade-B">Grade-B (Commercial Standard)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-stone-600 font-medium mb-0.5">Moisture (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lotMoisture}
                      onChange={(e) => setLotMoisture(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-0.5">Defect Rate (&lt; %)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lotDefect}
                      onChange={(e) => setLotDefect(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-0.5">Color Uniformity (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={lotColorUniformity}
                      onChange={(e) => setLotColorUniformity(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-0.5 text-[11px]">Certifying Quality Lab</label>
                  <input
                    type="text"
                    value={lotCertifiedBy}
                    onChange={(e) => setLotCertifiedBy(e.target.value)}
                    placeholder="e.g. Agmark Quality Lab Nashik, MSAMB Quality Cell"
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex gap-3 pt-3 mt-auto sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateLotModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={creatingLot || lotMemberFarmers.length < 2}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  {creatingLot 
                    ? 'Publishing Graded FPO Lot...' 
                    : `Publish Graded Lot (${lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0)} ${lotUnit} • ${lotMemberFarmers.length} Farmers)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB: PAYMENT & FARM SETTINGS */}
      {subTab === 'payment-settings' && (
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Farmer Payment & Farm Location Settings</h3>
                <p className="text-xs text-stone-500">
                  Configure your verified UPI ID to receive direct instant customer payments and set your exact farm pickup point on the map.
                </p>
              </div>
            </div>

            {settingsSaveMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                settingsSaveMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <span>{settingsSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Section 1: UPI ID */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <IndianRupee className="w-4 h-4" />
                  <span>Direct UPI Payment Configuration</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your UPI ID (VPA) is used by FarmiQ to generate dynamic QR codes and direct payment links for customers when you accept their orders.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Farmer UPI ID (VPA):
                    </label>
                    <input
                      type="text"
                      required
                      value={farmerUpiId}
                      onChange={(e) => setFarmerUpiId(e.target.value)}
                      placeholder="e.g. 9133144324@ybl"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Payee Legal Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={farmerUpiName}
                      onChange={(e) => setFarmerUpiName(e.target.value)}
                      placeholder="e.g. Farmer Name"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
                  <span>Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFarmerUpiId(user.phone ? `${user.phone}@ybl` : 'farmer@ybl');
                      setFarmerUpiName(user.full_name || 'Farmer');
                    }}
                    className="px-2 py-0.5 bg-white border border-stone-300 rounded text-emerald-800 hover:bg-emerald-50 transition cursor-pointer font-mono"
                  >
                    {user.phone ? `${user.phone}@ybl` : 'farmer@ybl'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFarmerUpiId('farmer@upi');
                      setFarmerUpiName(user.full_name || 'Farmer');
                    }}
                    className="px-2 py-0.5 bg-white border border-stone-300 rounded text-emerald-800 hover:bg-emerald-50 transition cursor-pointer font-mono"
                  >
                    farmer@upi
                  </button>
                </div>
              </div>

              {/* Section 2: Farm Location */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
                    <MapPin className="w-4 h-4" />
                    <span>Farm Gate Pickup Point</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Pin on Interactive Map / GPS</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Farm Address & Location:
                  </label>
                  <textarea
                    rows={2}
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    placeholder="Survey No., Village, Post, Taluka, District, State"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Saving Settings...' : 'Save Payment & Farm Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        order={selectedInvoiceOrder}
        isCustomer={false}
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        user={user}
        defaultAddress={farmLocation}
        title="Set Farm Gate Pickup Location"
        onAddressSaved={(addr) => {
          setFarmLocation(addr);
          setSettingsSaveMsg('✓ Farm location updated from map! Click "Save Payment & Farm Profile" to confirm.');
        }}
      />

      {/* Modal 1: Form New FPO Collective */}
      {showCreateCollectiveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-300" />
                <h3 className="text-base font-bold font-['Outfit']">Form New FPO Collective</h3>
              </div>
              <button onClick={() => setShowCreateCollectiveModal(false)} className="text-teal-200 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCollective} className="p-6 space-y-4 overflow-y-auto text-xs text-left">
              <div>
                <label className="block font-bold text-stone-700 mb-1">FPO Collective Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Farmers Producer Collective"
                  value={newCollectiveName}
                  onChange={e => setNewCollectiveName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-teal-600 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Primary Focus Crop *</label>
                  <select
                    value={newCollectiveCrop}
                    onChange={e => setNewCollectiveCrop(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-teal-600 text-stone-900 bg-white"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Mango">Mango</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Maize">Maize</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target Volume (Quintals) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newCollectiveTargetVolume}
                    onChange={e => setNewCollectiveTargetVolume(Number(e.target.value) || '')}
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-teal-600 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Cluster Hub Location</label>
                <input
                  type="text"
                  value={newCollectiveLocation}
                  onChange={e => setNewCollectiveLocation(e.target.value)}
                  placeholder="e.g. Lasalgaon, Nashik"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-teal-600 text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Collective Objectives / Description</label>
                <textarea
                  rows={2}
                  value={newCollectiveDescription}
                  onChange={e => setNewCollectiveDescription(e.target.value)}
                  placeholder="e.g. Aggregating high-grade harvest quotas for direct supply to retail chains and institutional processors."
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-teal-600 text-stone-900"
                />
              </div>

              {/* Multi-Farmer Invite Checklist */}
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Invite Member Farmers from Network ({selectedInviteFarmerIds.length} Selected)
                </label>
                <div className="border border-stone-200 rounded-xl p-2.5 space-y-2 max-h-40 overflow-y-auto bg-stone-50">
                  {networkFarmers.length === 0 ? (
                    <p className="text-stone-400 italic">No other registered farmers in your network yet.</p>
                  ) : (
                    networkFarmers.map(nf => {
                      const isSelected = selectedInviteFarmerIds.includes(nf.id);
                      return (
                        <label
                          key={nf.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-teal-50 border-teal-300 text-teal-900'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedInviteFarmerIds(prev => prev.filter(id => id !== nf.id));
                                } else {
                                  setSelectedInviteFarmerIds(prev => [...prev, nf.id]);
                                }
                              }}
                              className="w-4 h-4 text-teal-600 rounded"
                            />
                            <div>
                              <div className="font-bold">{nf.full_name} ({nf.farm_name})</div>
                              <div className="text-[10px] text-stone-500">{nf.location} • {nf.phone}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateCollectiveModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCollective}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creatingCollective ? 'Forming Collective...' : 'Form Collective & Send Invites'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Invite Farmers to Collective */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-300" />
                <h3 className="text-sm font-bold font-['Outfit']">
                  {selectedCollectiveForInvite ? `Invite Farmers to ${selectedCollectiveForInvite.name}` : `Select Collective to Invite ${selectedFarmerToInviteDirect?.full_name}`}
                </h3>
              </div>
              <button onClick={() => { setShowInviteModal(false); setSelectedCollectiveForInvite(null); setSelectedFarmerToInviteDirect(null); }} className="text-teal-200 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto text-xs text-left">
              {selectedCollectiveForInvite ? (
                /* Pick farmer to invite to this collective */
                <>
                  <p className="text-stone-500">
                    Select a verified farmer from the network to invite to <strong>{selectedCollectiveForInvite.name}</strong>:
                  </p>
                  <div className="space-y-2">
                    {networkFarmers
                      .filter(nf => !selectedCollectiveForInvite.members?.some(m => m.farmer_id === nf.id))
                      .map(nf => (
                        <div key={nf.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-stone-900">{nf.full_name}</div>
                            <div className="text-[11px] text-stone-500">{nf.farm_name} • {nf.location}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInviteFarmerToCollective(selectedCollectiveForInvite.id, nf.id)}
                            disabled={invitingFarmer}
                            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                          >
                            Send Invite
                          </button>
                        </div>
                      ))}
                    {networkFarmers.filter(nf => !selectedCollectiveForInvite.members?.some(m => m.farmer_id === nf.id)).length === 0 && (
                      <p className="text-stone-400 italic text-center py-4">All available platform farmers are already members or have pending invitations.</p>
                    )}
                  </div>
                </>
              ) : selectedFarmerToInviteDirect ? (
                /* Pick collective to invite selected farmer into */
                <>
                  <p className="text-stone-500">
                    Choose which FPO Collective to invite <strong>{selectedFarmerToInviteDirect.full_name}</strong> to:
                  </p>
                  <div className="space-y-2">
                    {collectives.map(c => (
                      <div key={c.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-stone-900">{c.name}</div>
                          <div className="text-[11px] text-stone-500">{c.focus_crop} • {c.target_volume_quintal} Quintals</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInviteFarmerToCollective(c.id, selectedFarmerToInviteDirect.id)}
                          disabled={invitingFarmer}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                        >
                          Invite Here
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {/* INSTANT CASH ON DELIVERY (COD) ORDER ALERT POPUP FOR FARMER */}
      {pendingCodOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-300 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Immediate Attention
                  </span>
                  <h3 className="text-base font-bold text-stone-900">New Cash on Delivery Order</h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-stone-500">#{pendingCodOrder.id}</span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Customer:</span>
                <span className="font-bold text-stone-900 text-sm">{pendingCodOrder.customer_name}</span>
              </div>
              {pendingCodOrder.customer_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Phone:</span>
                  <span className="font-bold text-emerald-800">{pendingCodOrder.customer_phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Ordered Item:</span>
                <span className="font-bold text-stone-900">
                  {pendingCodOrder.quantity} {pendingCodOrder.unit} {pendingCodOrder.product_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Cash to Collect on Delivery:</span>
                <span className="font-extrabold text-emerald-800 text-base">₹{pendingCodOrder.grand_total}</span>
              </div>
              <div className="pt-2 border-t border-stone-200">
                <span className="text-stone-500 font-medium block mb-0.5">Delivery Address:</span>
                <span className="text-stone-800 font-medium leading-relaxed">{pendingCodOrder.delivery_address}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              💡 <strong>Accepting</strong> this order moves it directly to <strong>PREPARING</strong> for packing & sorting. 
              <strong> Rejecting</strong> will immediately notify the customer with zero deduction.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleCodAction(pendingCodOrder.id, false)}
                disabled={updatingOrderId === pendingCodOrder.id}
                className="flex-1 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
              >
                Reject Order
              </button>
              <button
                type="button"
                onClick={() => handleCodAction(pendingCodOrder.id, true)}
                disabled={updatingOrderId === pendingCodOrder.id}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Accept COD Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Agent Modal */}
      {assignAgentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {assignAgentModalOrder.delivery_agent_assigned ? 'Change Delivery Agent' : 'Assign Delivery Agent'}
                  </h3>
                  <p className="text-[11px] text-stone-500">Order #{assignAgentModalOrder.id} • {assignAgentModalOrder.product_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignAgentModalOrder(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
              💡 <strong>Direct Dispatch Default:</strong> Until you assign a delivery agent, your name (<strong>{user.full_name}</strong>) and phone (<strong>{user.phone}</strong>) are displayed to the customer as the direct dispatch contact. Once assigned, the customer gets an instant popup alert!
            </div>

            {assignAgentSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{assignAgentSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDeliveryAgent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Delivery Agent Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar or FastAgri Express"
                  value={agentNameInput}
                  onChange={(e) => setAgentNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Delivery Agent Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={agentPhoneInput}
                  onChange={(e) => setAgentPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Vehicle Registration Number <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-14-BN-2502 or EV Two-Wheeler"
                  value={agentVehicleInput}
                  onChange={(e) => setAgentVehicleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignAgentModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAgent}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-stone-400"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingAgent ? 'Assigning...' : 'Assign & Notify Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escrow FPO Guarantee Modal */}
      <EscrowFPOModal
        contract={fpoModalContract}
        isOpen={!!fpoModalContract}
        onClose={() => {
          if (fpoModalContract) {
            sessionStorage.setItem('dismissed_fpo_modal_' + fpoModalContract.id, 'true');
          }
          setFpoModalContract(null);
        }}
        onDispatchProduce={handleDispatchContractProduce}
      />
    </div>
  );
};
